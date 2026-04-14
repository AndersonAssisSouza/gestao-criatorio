const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const gaiolasController = require('../controllers/gaiolas.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

router.get('/', gaiolasController.list)
router.post('/', gaiolasController.create)
router.put('/:id', gaiolasController.update)
router.delete('/:id', gaiolasController.remove)

module.exports = router
