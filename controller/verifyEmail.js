const User = require('../model/usermodel')
const { hashToken } = require('../utils/tokenHelper')

const verifyEmail = async (req, res) => {
  try {
    const token = req.body.token || req.query.token

    if (!token) {
      return res.status(400).send({
        success: false,
        message: 'Verification token is required.',
      })
    }

    const hashedToken = hashToken(token)
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
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

module.exports = verifyEmail
