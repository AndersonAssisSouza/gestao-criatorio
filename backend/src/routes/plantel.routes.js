const router            = require('express').Router()
const plantelController = require('../controllers/plantel.controller')
const authMiddleware    = require('../middleware/auth.middleware')
const { apiLimiter }    = require('../middleware/rateLimit')

// Todas as rotas do plantel exigem autenticação
router.use(authMiddleware)
router.use(apiLimiter)

router.get('/',     plantelController.listar)
router.get('/:id',  plantelController.buscarPorId)
router.post('/',    plantelController.criar)
router.put('/:id',  plantelController.atualizar)
router.delete('/:id', plantelController.remover)

module.exports = router
