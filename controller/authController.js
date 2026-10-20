const bcrypt = require('bcrypt')
const User = require('../model/usermodel')
const RefreshToken = require('../model/refreshtokenmodel')
const {
  clearRefreshTokenCookie,
  createEmailVerificationToken,
  createPasswordResetToken,
  hashToken,
  publicUser,
  verifyRefreshToken,
} = require('../utils/tokenHelper')
const {
  issueAuthTokens,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
} = require('../utils/issueTokens')
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require('../utils/mailer')

async function registrationController(req, res) {
  try {
    const { name, email, password, phone, address, gender, dateOfBirth } = req.body
    const existedUser = await User.findOne({ email })

    if (existedUser) {
      return res.status(409).send({
        success: false,
        message: 'User already exists.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const verification = createEmailVerificationToken()
    const registeredUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      gender,
      dateOfBirth,
      isVerified: false,
      emailVerificationToken: verification.hashedToken,
      emailVerificationExpires: verification.expiresAt,
    })
    const mail = await sendVerificationEmail(registeredUser, verification.token)

    return res.status(201).send({
      success: true,
      message: mail.delivered
        ? 'Account created. Please check your email to verify your address.'
        : 'Account created. Email could not be sent, so use the verification link from the server logs or resend it.',
      data: publicUser(registeredUser),
      ...(mail.delivered || process.env.NODE_ENV === 'production'
        ? {}
        : {
            devVerificationUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verification.token}`,
          }),
    })
  } catch (error) {
    console.error('register error:', error)
    return res.status(500).send({
      success: false,
      message: 'Server error during registration.',
    })
  }
}

async function loginController(req, res) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).send({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return res.status(401).send({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before signing in.',
      })
    }

    const tokens = await issueAuthTokens(res, user)

    return res.send({
      success: true,
      message: 'User logged in successfully.',
      data: {
        user: publicUser(user),
        ...tokens,
      },
    })
  } catch (error) {
    console.error('login error:', error)
    return res.status(500).send({
      success: false,
      message: 'Something went wrong on the server.',
    })
  }
}

async function verifyEmailController(req, res) {
  try {
    const token = req.body?.token || req.params?.token || req.query?.token

    if (!token) {
      return res.status(400).send({
        success: false,
        message: 'Verification token is required.',
      })
    }

    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires')

    if (!user) {
      return res.status(400).send({
        success: false,
        message: 'Verification token is invalid or has expired.',
      })
    }

    user.isVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    return res.send({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    })
  } catch (error) {
    console.error('verifyEmail error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not verify email.',
    })
  }
}

async function resendVerificationController(req, res) {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
      .select('+emailVerificationToken +emailVerificationExpires')

    const genericResponse = {
      success: true,
      message: 'If that email is registered and unverified, a new verification link has been sent.',
    }

    if (!user || user.isVerified) {
      return res.send(genericResponse)
    }

    const verification = createEmailVerificationToken()
    user.emailVerificationToken = verification.hashedToken
    user.emailVerificationExpires = verification.expiresAt
    await user.save()

    const mail = await sendVerificationEmail(user, verification.token)

    return res.send({
      ...genericResponse,
      ...(mail.delivered || process.env.NODE_ENV === 'production'
        ? {}
        : {
            devVerificationUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verification.token}`,
          }),
    })
  } catch (error) {
    console.error('resendVerification error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not resend verification email.',
    })
  }
}

async function refreshTokenController(req, res) {
  try {
    const incomingToken = req.body.refreshToken || req.cookies.refreshToken

    if (!incomingToken) {
      return res.status(401).send({
        success: false,
        message: 'Refresh token is required.',
      })
    }

    let decoded
    try {
      decoded = verifyRefreshToken(incomingToken)
    } catch {
      return res.status(401).send({
        success: false,
        message: 'Invalid or expired refresh token.',
      })
    }

    const storedToken = await RefreshToken.findOne({ tokenHash: hashToken(incomingToken) })
    if (!storedToken || storedToken.expiresAt.getTime() < Date.now()) {
      return res.status(401).send({
        success: false,
        message: 'Refresh token is no longer valid.',
      })
    }

    const user = await User.findById(decoded.userId)
    if (!user || !user.isVerified) {
      await revokeRefreshToken(incomingToken)
      return res.status(401).send({
        success: false,
        message: 'Unable to refresh session.',
      })
    }

    await revokeRefreshToken(incomingToken)
    const tokens = await issueAuthTokens(res, user)

    return res.send({
      success: true,
      message: 'Tokens refreshed.',
      data: {
        user: publicUser(user),
        ...tokens,
      },
    })
  } catch (error) {
    console.error('refresh error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not refresh tokens.',
    })
  }
}

async function logoutController(req, res) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken
    const logoutAll = Boolean(req.body.logoutAll)

    if (logoutAll && req.user?._id) {
      await revokeAllUserRefreshTokens(req.user._id)
    } else {
      await revokeRefreshToken(refreshToken)
    }

    clearRefreshTokenCookie(res)

    return res.send({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (error) {
    console.error('logout error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not log out.',
    })
  }
}

async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    const genericResponse = {
      success: true,
      message: 'If that email is registered, a password reset link has been sent.',
    }

    if (!user) {
      return res.send(genericResponse)
    }

    const reset = createPasswordResetToken()
    user.passwordResetToken = reset.hashedToken
    user.passwordResetExpires = reset.expiresAt
    await user.save()

    const mail = await sendPasswordResetEmail(user, reset.token)

    return res.send({
      ...genericResponse,
      ...(mail.delivered || process.env.NODE_ENV === 'production'
        ? {}
        : {
            devResetUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${reset.token}`,
          }),
    })
  } catch (error) {
    console.error('forgotPassword error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not process the password reset request.',
    })
  }
}

async function resetPasswordController(req, res) {
  try {
    const { token, password } = req.body

    if (!token) {
      return res.status(400).send({
        success: false,
        message: 'Reset token is required.',
      })
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +password')

    if (!user) {
      return res.status(400).send({
        success: false,
        message: 'Reset token is invalid or has expired.',
      })
    }

    user.password = await bcrypt.hash(password, 10)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    await revokeAllUserRefreshTokens(user._id)

    return res.send({
      success: true,
      message: 'Password reset successfully. You can now sign in.',
    })
  } catch (error) {
    console.error('resetPassword error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not reset password.',
    })
  }
}

async function getMeController(req, res) {
  return res.send({
    success: true,
    message: 'Authenticated user.',
    data: publicUser(req.user),
  })
}

module.exports = {
  registrationController,
  loginController,
  verifyEmailController,
  resendVerificationController,
  refreshTokenController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  getMeController,
}
