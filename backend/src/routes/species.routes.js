const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const csrfProtection = require('../middleware/csrf.middleware')
const { requireAccess, requireOwner } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const speciesController = require('../controllers/species.controller')

router.use(authMiddleware)
router.use(requireAccess)
router.use(apiLimiter)

// Leitura: qualquer usuário autenticado (catálogo global)
router.get('/', speciesController.list)
router.get('/lookup', speciesController.lookup)

// Mutação: apenas owner (catálogo controlado)
router.post('/', requireOwner, csrfProtection, speciesController.create)
router.put('/:id', requireOwner, csrfProtection, speciesController.update)
router.delete('/:id', requireOwner, csrfProtection, speciesController.remove)

module.exports = router
