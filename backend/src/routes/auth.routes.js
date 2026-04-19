const router         = require('express').Router()
const authController  = require('../controllers/auth.controller')
const authMiddleware  = require('../middleware/auth.middleware')
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit')

router.post('/register', registerLimiter, authController.register)
router.post('/login',    loginLimiter, authController.login)
router.post('/forgot-password', loginLimiter, authController.forgotPassword)
router.post('/reset-password', registerLimiter, authController.resetPassword)
router.get('/me',        authMiddleware, authController.me)
router.post('/logout',   authMiddleware, authController.logout)
router.post('/logout-all', authMiddleware, authController.logoutAll)
router.get('/verify-email', authController.verifyEmail)
router.post('/verify-email', authController.verifyEmail)
router.post('/resend-verification', loginLimiter, authController.resendVerification)

module.exports = router
