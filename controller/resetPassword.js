const bcrypt = require('bcrypt')
const User = require('../model/usermodel')
const { hashToken } = require('../utils/tokenHelper')
const { revokeAllUserRefreshTokens } = require('../utils/issueTokens')

const resetPassword = async (req, res) => {
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

module.exports = resetPassword
