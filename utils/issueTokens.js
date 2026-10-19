const crypto = require('crypto')
const RefreshToken = require('../model/refreshtokenmodel')
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshExpiryDate,
  setRefreshTokenCookie,
} = require('./tokenHelper')

async function issueAuthTokens(res, user) {
  const tokenId = crypto.randomUUID()
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
  })
  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    tokenId,
  })

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshExpiryDate(),
  })

  setRefreshTokenCookie(res, refreshToken)

  return { accessToken, refreshToken }
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return
  const { hashToken } = require('./tokenHelper')
  await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) })
}

async function revokeAllUserRefreshTokens(userId) {
  await RefreshToken.deleteMany({ user: userId })
}

module.exports = {
  issueAuthTokens,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
}
