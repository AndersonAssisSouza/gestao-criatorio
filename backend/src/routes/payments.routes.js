const router = require('express').Router()
const paymentController = require('../controllers/payment.controller')

router.post('/mercadopago/webhook', paymentController.handleMercadoPagoWebhook)

module.exports = router
