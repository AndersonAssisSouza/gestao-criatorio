const router = require('express').Router()
const paymentController = require('../controllers/payment.controller')

// Webhook público (autenticado via HMAC dentro do handler)
router.post('/mercadopago/webhook', paymentController.handleMercadoPagoWebhook)

module.exports = router
