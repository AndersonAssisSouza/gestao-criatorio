const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const mutacoesController = require('../controllers/mutacoes.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

router.get('/', mutacoesController.list)
router.post('/', mutacoesController.create)

module.exports = router
