const User = require('../model/usermodel')
const RefreshToken = require('../model/refreshtokenmodel')
const { hashToken, verifyRefreshToken, publicUser } = require('../utils/tokenHelper')
const { issueAuthTokens, revokeRefreshToken } = require('../utils/issueTokens')

const refresh = async (req, res) => {
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

module.exports = refresh
