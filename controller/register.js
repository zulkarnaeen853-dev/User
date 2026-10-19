const bcrypt = require('bcrypt')
const User = require('../model/usermodel')
const { createEmailVerificationToken, publicUser } = require('../utils/tokenHelper')
const { sendVerificationEmail } = require('../utils/mailer')

const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, gender, dateOfBirth } = req.body
    const existedUser = await User.findOne({ email })

    if (existedUser) {
      return res.status(409).send({
        success: false,
        message: 'User already exists.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const verification = createEmailVerificationToken()

    const registeredUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      gender,
      dateOfBirth,
      isVerified: false,
      emailVerificationToken: verification.hashedToken,
      emailVerificationExpires: verification.expiresAt,
    })

    const mail = await sendVerificationEmail(registeredUser, verification.token)

    return res.status(201).send({
      success: true,
      message: mail.delivered
        ? 'Account created. Please check your email to verify your address.'
        : 'Account created. Email could not be sent, so use the verification link from the server logs or resend it.',
      data: publicUser(registeredUser),
      ...(mail.delivered || process.env.NODE_ENV === 'production'
        ? {}
        : { devVerificationUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verification.token}` }),
    })
  } catch (error) {
    console.error('register error:', error)
    return res.status(500).send({
      success: false,
      message: 'Server error during registration.',
    })
  }
}

module.exports = register
