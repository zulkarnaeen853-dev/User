const { clearRefreshTokenCookie } = require('../utils/tokenHelper')
const { revokeRefreshToken, revokeAllUserRefreshTokens } = require('../utils/issueTokens')

const logout = async (req, res) => {
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

module.exports = logout
