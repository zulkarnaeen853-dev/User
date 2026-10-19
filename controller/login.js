const bcrypt = require('bcrypt')
const User = require('../model/usermodel')
const { publicUser } = require('../utils/tokenHelper')
const { issueAuthTokens } = require('../utils/issueTokens')

const login = async (req, res) => {
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

module.exports = login
