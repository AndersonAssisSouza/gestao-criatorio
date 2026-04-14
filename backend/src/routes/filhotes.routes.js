const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const filhotesController = require('../controllers/filhotes.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

router.get('/', filhotesController.list)
router.put('/:id', filhotesController.update)
router.post('/:id/mark-death', filhotesController.markDeath)
router.post('/:id/transfer-to-plantel', filhotesController.transferToPlantel)

module.exports = router
