const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const csrfProtection = require('../middleware/csrf.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const criatorioController = require('../controllers/criatorio.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

router.get('/me', criatorioController.listarMeuCriatorio)
router.post('/me', csrfProtection, criatorioController.criarMeuCriatorio)
router.put('/me/:id', csrfProtection, criatorioController.atualizarMeuCriatorio)
router.delete('/me/:id', csrfProtection, criatorioController.removerMeuCriatorio)

module.exports = router
