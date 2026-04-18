const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const { attachCurrentUser, requireOwner } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const cuponsController = require('../controllers/cupons.controller')

// Validação pública (sem auth completa, mas pode aproveitar user se logado)
router.get('/validar', apiLimiter, (req, res, next) => {
  // Tentar anexar user, mas não bloqueia se não estiver logado
  authMiddleware(req, res, () => {
    attachCurrentUser(req, res, () => cuponsController.validarCupomPublico(req, res))
  })
})

// Rotas autenticadas
router.use(authMiddleware)
router.use(attachCurrentUser)
router.use(apiLimiter)

// Captador vê seu próprio programa
router.get('/meu-programa', cuponsController.meuPrograma)

// Admin (owner-only)
router.get('/', requireOwner, cuponsController.listCuponsAdmin)
router.post('/', requireOwner, cuponsController.createCupomAdmin)
router.get('/:id', requireOwner, cuponsController.detalhesCupomAdmin)
router.put('/:id', requireOwner, cuponsController.updateCupomAdmin)
router.delete('/:id', requireOwner, cuponsController.deleteCupomAdmin)
router.post('/:id/payout', requireOwner, cuponsController.registrarPayoutAdmin)

module.exports = router
