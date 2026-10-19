const express = require('express')
const router = express.Router()

const register = require('../../controller/register')
const login = require('../../controller/login')
const logout = require('../../controller/logout')
const refresh = require('../../controller/refresh')
const verifyEmail = require('../../controller/verifyEmail')
const resendVerification = require('../../controller/resendVerification')
const forgotPassword = require('../../controller/forgotPassword')
const resetPassword = require('../../controller/resetPassword')
const me = require('../../controller/me')
const {
  RegisterMiddleware,
  LoginMiddleware,
  EmailMiddleware,
  ResetPasswordMiddleware,
  protect,
  optionalProtect,
} = require('../../middleware/authmiddleware')

router.post('/register', RegisterMiddleware, register)
router.post('/login', LoginMiddleware, login)
router.post('/logout', optionalProtect, logout)
router.post('/refresh', refresh)
router.get('/verify-email', verifyEmail)
router.post('/verify-email', verifyEmail)
router.post('/resend-verification', EmailMiddleware, resendVerification)
router.post('/forgot-password', EmailMiddleware, forgotPassword)
router.post('/reset-password', ResetPasswordMiddleware, resetPassword)
router.get('/me', protect, me)

module.exports = router
