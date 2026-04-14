const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const speciesController = require('../controllers/species.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

router.get('/', speciesController.list)
router.post('/', speciesController.create)
router.put('/:id', speciesController.update)
router.delete('/:id', speciesController.remove)
router.get('/lookup', speciesController.lookup)

module.exports = router
