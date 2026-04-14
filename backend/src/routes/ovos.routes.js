const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const ovosController = require('../controllers/ovos.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

router.get('/', ovosController.list)
router.post('/', ovosController.create)
router.post('/restart-clutch', ovosController.restartClutch)
router.post('/:id/status', ovosController.updateStatus)

module.exports = router
