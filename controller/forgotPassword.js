const User = require('../model/usermodel')
const { createPasswordResetToken } = require('../utils/tokenHelper')
const { sendPasswordResetEmail } = require('../utils/mailer')

const forgotPassword = async (req, res) => {
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
        : { devResetUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${reset.token}` }),
    })
  } catch (error) {
    console.error('forgotPassword error:', error)
    return res.status(500).send({
      success: false,
      message: 'Could not process the password reset request.',
    })
  }
}

module.exports = forgotPassword
