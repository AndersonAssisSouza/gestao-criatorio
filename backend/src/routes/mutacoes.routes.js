const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const csrfProtection = require('../middleware/csrf.middleware')
const { requireAccess, requireOwner } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const mutacoesController = require('../controllers/mutacoes.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

// Catálogo global — leitura para todos autenticados
router.get('/', mutacoesController.list)

// Escrita apenas owner
router.post('/', requireOwner, csrfProtection, mutacoesController.create)

module.exports = router
