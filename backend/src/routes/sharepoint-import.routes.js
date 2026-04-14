const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const csrfProtection = require('../middleware/csrf.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const { requireOwner } = require('../middleware/access.middleware')
const controller = require('../controllers/sharepoint-import.controller')

router.use(authMiddleware)
router.use(apiLimiter)
router.use(requireOwner)

router.get('/me/snapshot', controller.getMyImportedData)
router.post('/me/import', csrfProtection, controller.importMyData)

module.exports = router
