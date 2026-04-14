const express = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const { requireAccess } = require('../middleware/access.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const controller = require('../controllers/aneis.controller')

const router = express.Router()

router.use(authMiddleware, requireAccess, apiLimiter)

router.get('/', controller.list)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

module.exports = router
