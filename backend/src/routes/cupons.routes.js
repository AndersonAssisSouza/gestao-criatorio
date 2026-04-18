const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const { attachCurrentUser, requireOwner } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const cuponsController = require('../controllers/cupons.controller')

// Rotas públicas
router.get('/validar', apiLimiter, cuponsController.validarCupomPublico)
router.get('/ranking', apiLimiter, cuponsController.rankingPublico)

// Rotas autenticadas
router.use(authMiddleware)
router.use(attachCurrentUser)
router.use(apiLimiter)

// Captador vê seu próprio programa
router.get('/meu-programa', cuponsController.meuPrograma)
router.post('/meu-programa/:id/solicitar-payout', cuponsController.solicitarPayout)

// Admin (owner-only)
router.get('/payout-requests', requireOwner, cuponsController.listPayoutRequestsAdmin)
router.get('/', requireOwner, cuponsController.listCuponsAdmin)
router.post('/', requireOwner, cuponsController.createCupomAdmin)
router.get('/:id', requireOwner, cuponsController.detalhesCupomAdmin)
router.put('/:id', requireOwner, cuponsController.updateCupomAdmin)
router.delete('/:id', requireOwner, cuponsController.deleteCupomAdmin)
router.post('/:id/payout', requireOwner, cuponsController.registrarPayoutAdmin)
router.post('/admin/simular-indicacao', requireOwner, cuponsController.simularIndicacaoAdmin)

module.exports = router
