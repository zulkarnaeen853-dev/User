const User = require('../model/usermodel')
const { createEmailVerificationToken } = require('../utils/tokenHelper')
const { sendVerificationEmail } = require('../utils/mailer')

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires')

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
        : { devVerificationUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verification.token}` }),
    })
  } catch (error) {
    console.error('resendVerification error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not resend verification email.',
    })
  }
}

module.exports = resendVerification
