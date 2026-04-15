const router = require('express').Router()
const paymentController = require('../controllers/payment.controller')
const { getPaymentGatewayConfig } = require('../config/payment-gateway.config')
const axios = require('axios')

router.post('/mercadopago/webhook', paymentController.handleMercadoPagoWebhook)

// Endpoint temporário para registrar webhook no MercadoPago
// Acesso restrito: requer header X-Owner-Key com a chave do proprietário
router.post('/mercadopago/register-webhook', async (req, res) => {
  try {
    const ownerKey = req.headers['x-owner-key'] || ''
    if (ownerKey !== process.env.OWNER_ACCESS_KEY) {
      return res.status(403).json({ message: 'Acesso negado.' })
    }

    const config = getPaymentGatewayConfig()
    if (!config.mercadoPago.accessToken) {
      return res.status(500).json({ message: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' })
    }

    const webhookUrl = `${config.backendPublicUrl}/api/payments/mercadopago/webhook`

    const authHeaders = {
      Authorization: `Bearer ${config.mercadoPago.accessToken}`,
      'Content-Type': 'application/json',
    }

    // Método 1: Tentar via /v2/your_stores (notification_url na app)
    // Método 2: Tentar via /v1/notifications/webhooks
    // Método 3: Configurar notification_url diretamente em cada preferência (já funciona)

    const results = {}

    // Listar webhooks existentes
    try {
      const { data: existing } = await axios.get('https://api.mercadopago.com/v1/notifications/webhooks', { headers: authHeaders })
      results.existingWebhooks = existing
    } catch (e) {
      results.existingWebhooksError = e.response?.data || e.message
    }

    // Tentar registrar via endpoint atual
    try {
      const { data } = await axios.post('https://api.mercadopago.com/v1/notifications', {
        url: webhookUrl,
        topics: ['payment'],
      }, { headers: authHeaders })
      results.registered = data
    } catch (e) {
      results.registerError = e.response?.data || e.message
    }

    // Tentar via endpoint alternativo
    try {
      const { data: apps } = await axios.get('https://api.mercadopago.com/v1/applications/search', { headers: authHeaders })
      results.applications = apps
    } catch (e) {
      results.appsError = e.response?.data || e.message
    }

    // O MercadoPago configura notification_url automaticamente por preferência
    // Na criação do checkout, já passamos notification_url (mercadopago.service.js)
    // Isso funciona sem necessidade de registrar webhook separadamente

    return res.json({
      success: true,
      webhookUrl,
      message: 'O MercadoPago já recebe notificações via notification_url em cada preferência de checkout. URL configurada automaticamente.',
      diagnostics: results,
    })
  } catch (error) {
    console.error('[payments/register-webhook]', error.response?.data || error.message)
    return res.status(500).json({
      message: 'Erro ao registrar webhook.',
      details: error.response?.data || error.message,
    })
  }
})

module.exports = router
