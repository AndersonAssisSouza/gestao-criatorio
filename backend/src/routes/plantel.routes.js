const router            = require('express').Router()
const plantelController = require('../controllers/plantel.controller')
const authMiddleware    = require('../middleware/auth.middleware')
const csrfProtection    = require('../middleware/csrf.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter }    = require('../middleware/rateLimit')

// Todas as rotas do plantel exigem autenticação
router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

router.get('/',     plantelController.listar)
router.get('/:id',  plantelController.buscarPorId)
router.post('/',    csrfProtection, plantelController.criar)
router.put('/:id',  csrfProtection, plantelController.atualizar)
router.delete('/:id', csrfProtection, plantelController.remover)

module.exports = router
