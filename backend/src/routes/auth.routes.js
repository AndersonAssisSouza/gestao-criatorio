const router         = require('express').Router()
const authController  = require('../controllers/auth.controller')
const authMiddleware  = require('../middleware/auth.middleware')
const { loginLimiter } = require('../middleware/rateLimit')

router.post('/register', authController.register)
router.post('/login',    loginLimiter, authController.login)
router.get('/me',        authMiddleware, authController.me)

module.exports = router
