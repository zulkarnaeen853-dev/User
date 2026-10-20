const express = require('express')
const router = express.Router()

const authController = require('../../controller/authController')
const {
  RegisterMiddleware,
  LoginMiddleware,
  EmailMiddleware,
  ResetPasswordMiddleware,
  protect,
  optionalProtect,
} = require('../../middleware/authmiddleware')

router.post('/registration', RegisterMiddleware, authController.registrationController)
router.post('/register', RegisterMiddleware, authController.registrationController)
router.post('/login', LoginMiddleware, authController.loginController)

router.get('/verify-email', authController.verifyEmailController)
router.post('/verify-email', authController.verifyEmailController)
router.get('/verify-email/:token', authController.verifyEmailController)

router.post('/resend-verification', EmailMiddleware, authController.resendVerificationController)
router.post('/refresh', authController.refreshTokenController)
router.post('/refresh-token', authController.refreshTokenController)
router.post('/logout', optionalProtect, authController.logoutController)

router.post('/forgot-password', EmailMiddleware, authController.forgotPasswordController)
router.post('/reset-password', ResetPasswordMiddleware, authController.resetPasswordController)
router.post(
  '/reset-password/:token',
  (req, res, next) => {
    req.body.token = req.params.token
    next()
  },
  ResetPasswordMiddleware,
  authController.resetPasswordController,
)

router.get('/me', protect, authController.getMeController)


module.exports = router
