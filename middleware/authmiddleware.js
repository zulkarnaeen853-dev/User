const User = require('../model/usermodel')
const { verifyAccessToken } = require('../utils/tokenHelper')

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

const RegisterMiddleware = (req, res, next) => {
  if (typeof req.body.email === 'string') req.body.email = req.body.email.trim().toLowerCase()
  if (typeof req.body.name === 'string') req.body.name = req.body.name.trim()

  const { name, email, password, phone, address, gender, dateOfBirth } = req.body
  const internationalRegex = /^\+?[1-9]\d{6,14}$/
  const standardGenderRegex = /^(male|female|non-binary|other|prefer\s*not\s*to\s*say|pnts)$/i
  const dobRegex = /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/

  if (!name) {
    return res.status(400).send({ success: false, message: 'Name is required' })
  }
  if (name.length < 6) {
    return res.status(400).send({ success: false, message: 'Name must be at least 6 characters long' })
  }

  if (!email) {
    return res.status(400).send({ success: false, message: 'Email is required' })
  }
  if (!emailRegex.test(email)) {
    return res.status(400).send({ success: false, message: 'Please enter a valid email address.' })
  }

  if (!password) {
    return res.status(400).send({ success: false, message: 'Password is required' })
  }
  if (password.length < 6) {
    return res.status(400).send({ success: false, message: 'Password must be at least 6 characters long' })
  }

  if (!phone) {
    return res.status(400).send({ success: false, message: 'Phone number is required' })
  }
  if (!internationalRegex.test(phone)) {
    return res.status(400).send({ success: false, message: 'Please enter a valid phone number.' })
  }

  if (!address) {
    return res.status(400).send({ success: false, message: 'Address is required.' })
  }

  if (!gender) {
    return res.status(400).send({ success: false, message: 'Gender is required.' })
  }
  if (!standardGenderRegex.test(gender)) {
    return res.status(400).send({ success: false, message: 'Please enter a valid gender.' })
  }

  if (!dateOfBirth) {
    return res.status(400).send({ success: false, message: 'Birth date is required.' })
  }
  if (!dobRegex.test(dateOfBirth)) {
    return res.status(400).send({ success: false, message: 'Birth date must be in DD-MM-YYYY format.' })
  }

  next()
}

const LoginMiddleware = (req, res, next) => {
  if (typeof req.body.email === 'string') req.body.email = req.body.email.trim().toLowerCase()

  const { email, password } = req.body

  if (!email) {
    return res.status(400).send({ success: false, message: 'Email is required' })
  }
  if (!emailRegex.test(email)) {
    return res.status(400).send({ success: false, message: 'Please enter a valid email address.' })
  }
  if (!password) {
    return res.status(400).send({ success: false, message: 'Password is required' })
  }

  next()
}

const EmailMiddleware = (req, res, next) => {
  if (typeof req.body.email === 'string') req.body.email = req.body.email.trim().toLowerCase()

  const { email } = req.body

  if (!email) {
    return res.status(400).send({ success: false, message: 'Email is required' })
  }
  if (!emailRegex.test(email)) {
    return res.status(400).send({ success: false, message: 'Please enter a valid email address.' })
  }

  next()
}

const ResetPasswordMiddleware = (req, res, next) => {
  const { token, password } = req.body

  if (!token) {
    return res.status(400).send({ success: false, message: 'Reset token is required.' })
  }
  if (!password) {
    return res.status(400).send({ success: false, message: 'Password is required' })
  }
  if (password.length < 6) {
    return res.status(400).send({ success: false, message: 'Password must be at least 6 characters long' })
  }

  next()
}

function getBearerToken(req) {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) {
    return header.slice(7)
  }
  return null
}

const protect = async (req, res, next) => {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return res.status(401).send({
        success: false,
        message: 'Access token is required.',
      })
    }

    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).send({
        success: false,
        message: 'User no longer exists.',
      })
    }
    if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email first.',
      })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).send({
      success: false,
      message: 'Invalid or expired access token.',
    })
  }
}

const optionalProtect = async (req, res, next) => {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return next()
    }
    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.userId)
    if (user) {
      req.user = user
    }
  } catch {
    // Logout and similar routes still work with a refresh token alone.
  }
  next()
}

module.exports = {
  RegisterMiddleware,
  LoginMiddleware,
  EmailMiddleware,
  ResetPasswordMiddleware,
  protect,
  optionalProtect,
}
