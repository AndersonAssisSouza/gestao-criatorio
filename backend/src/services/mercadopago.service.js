const axios = require('axios')
const { getPaymentGatewayConfig } = require('../config/payment-gateway.config')

const api = axios.create({
  baseURL: 'https://api.mercadopago.com',
  timeout: 15000,
})

function buildBackUrls(frontendPublicUrl) {
  return {
    success: `${frontendPublicUrl}/?checkout=success`,
    pending: `${frontendPublicUrl}/?checkout=pending`,
    failure: `${frontendPublicUrl}/?checkout=failure`,
  }
}

function buildPaymentMethods(method) {
  if (method === 'pix') {
    return {
      excluded_payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'ticket' },
      ],
      installments: 1,
      default_installments: 1,
    }
  }

  return {
    excluded_payment_types: [
      { id: 'bank_transfer' },
      { id: 'ticket' },
      { id: 'debit_card' },
    ],
    installments: 1,
    default_installments: 1,
  }
}

function normalizeMercadoPagoStatus(status = '') {
  const normalized = String(status || '').trim().toLowerCase()

  if (normalized === 'approved') return 'paid'
  if (['pending', 'in_process', 'in_mediation'].includes(normalized)) return 'processing'
  if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(normalized)) return 'rejected'
  return 'processing'
}

function formatPlanLabel(plan) {
  return plan === 'annual' ? 'Plano anual' : 'Plano mensal'
}

async function createCheckoutPreference({ payment, user, method }) {
  const config = getPaymentGatewayConfig()
  const payload = {
    items: [
      {
        id: payment.id,
        title: `Plumar • ${formatPlanLabel(payment.plan)}`,
        description: `Assinatura ${payment.plan === 'annual' ? 'anual' : 'mensal'} do sistema Plumar`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: Number(payment.amount),
      },
    ],
    payer: {
      name: user.name,
      email: user.email,
    },
    external_reference: payment.id,
    back_urls: buildBackUrls(config.frontendPublicUrl),
    auto_return: 'approved',
    notification_url: `${config.backendPublicUrl}/api/payments/mercadopago/webhook`,
    statement_descriptor: config.mercadoPago.statementDescriptor,
    payment_methods: buildPaymentMethods(method),
    metadata: {
      local_payment_id: payment.id,
      user_id: user.id,
      plan: payment.plan,
      preferred_method: method,
    },
  }

  const { data } = await api.post('/checkout/preferences', payload, {
    headers: {
      Authorization: `Bearer ${config.mercadoPago.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  return {
    preferenceId: data.id,
    checkoutUrl: data.init_point || data.sandbox_init_point || '',
    sandboxCheckoutUrl: data.sandbox_init_point || '',
    raw: data,
  }
}

async function getPaymentById(paymentId) {
  // Defesa contra SSRF/path-traversal: aceita apenas IDs numericos (formato MP).
  // paymentId vem do webhook body que, embora autenticado por HMAC, ainda pode
  // conter caracteres controlados pelo atacante antes da validacao HMAC.
  const safeId = String(paymentId || '').trim()
  if (!/^\d+$/.test(safeId)) {
    throw new Error(`paymentId inválido (não numérico): ${safeId.slice(0, 32)}`)
  }
  const config = getPaymentGatewayConfig()
  const { data } = await api.get(`/v1/payments/${encodeURIComponent(safeId)}`, {
    headers: {
      Authorization: `Bearer ${config.mercadoPago.accessToken}`,
    },
  })

  return {
    providerPaymentId: String(data.id),
    status: normalizeMercadoPagoStatus(data.status),
    rawStatus: data.status,
    paidAt: data.date_approved || data.date_last_updated || null,
    method: data.payment_type_id === 'bank_transfer' ? 'pix' : 'card',
    reference: data.external_reference || null,
    amount: Number(data.transaction_amount || 0),
    raw: data,
  }
}

module.exports = {
  createCheckoutPreference,
  getPaymentById,
  normalizeMercadoPagoStatus,
}
