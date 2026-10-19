const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
const EMAIL_VERIFICATION_EXPIRES_MS = Number(process.env.EMAIL_VERIFICATION_EXPIRES_MS) || 24 * 60 * 60 * 1000
const PASSWORD_RESET_EXPIRES_MS = Number(process.env.PASSWORD_RESET_EXPIRES_MS) || 15 * 60 * 1000

function assertSecrets() {
  if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in the environment.')
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

function generateAccessToken(payload) {
  assertSecrets()
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      type: 'access',
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  )
}

function generateRefreshToken(payload) {
  assertSecrets()
  return jwt.sign(
    {
      userId: payload.userId,
      tokenId: payload.tokenId,
      type: 'refresh',
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN },
  )
}

function verifyAccessToken(token) {
  assertSecrets()
  const decoded = jwt.verify(token, ACCESS_SECRET)
  if (decoded.type !== 'access') {
    throw new Error('Invalid access token.')
  }
  return decoded
}

function verifyRefreshToken(token) {
  assertSecrets()
  const decoded = jwt.verify(token, REFRESH_SECRET)
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token.')
  }
  return decoded
}

function createEmailVerificationToken() {
  const token = generateRandomToken()
  return {
    token,
    hashedToken: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_MS),
  }
}

function createPasswordResetToken() {
  const token = generateRandomToken()
  return {
    token,
    hashedToken: hashToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS),
  }
}

function parseExpiryToMs(value) {
  const match = String(value).match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const amount = Number(match[1])
  const unit = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[match[2]]
  return amount * unit
}

function getRefreshExpiryDate() {
  return new Date(Date.now() + parseExpiryToMs(REFRESH_EXPIRES_IN))
}

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: parseExpiryToMs(REFRESH_EXPIRES_IN),
    path: process.env.API || '/api/v1',
  })
}

function clearRefreshTokenCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: process.env.API || '/api/v1',
  })
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    profilePic: user.profilePic,
    isVerified: user.isVerified,
  }
}

module.exports = {
  hashToken,
  generateRandomToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  getRefreshExpiryDate,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  publicUser,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
}
