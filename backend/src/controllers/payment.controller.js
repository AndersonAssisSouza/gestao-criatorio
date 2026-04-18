const crypto = require('crypto')
const paymentRepository = require('../repositories/payment.repository')
const userRepository = require('../repositories/user.repository')
const { applyPaymentProfile, buildAccessSummary } = require('../utils/subscription.utils')
const { getPaymentById } = require('../services/mercadopago.service')
const { getPaymentGatewayConfig } = require('../config/payment-gateway.config')
const { notifyContractRelease } = require('../services/subscription-notification.service')
const cuponsController = require('./cupons.controller')

/**
 * Valida assinatura HMAC do webhook MercadoPago.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/security/x-signature
 *
 * Header x-signature tem formato: "ts=<timestamp>,v1=<hmac>"
 * Manifest: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 */
function verifyMercadoPagoSignature(req, dataId) {
  const config = getPaymentGatewayConfig()
  const secret = config.mercadoPago.webhookSecret

  if (!secret) {
    // Modo degradado: sem secret configurado, aceita (log warn).
    // Em produção com secret ausente, admin deve configurar.
    console.warn('[payments/webhook] MERCADOPAGO_WEBHOOK_SECRET ausente — aceitando sem validação HMAC')
    return true
  }

  const signatureHeader = req.headers['x-signature'] || req.headers['X-Signature'] || ''
  const requestId = req.headers['x-request-id'] || req.headers['X-Request-Id'] || ''

  if (!signatureHeader || !requestId) {
    return false
  }

  // Parse "ts=123,v1=abc"
  const parts = String(signatureHeader).split(',').reduce((acc, pair) => {
    const [k, v] = pair.split('=').map((s) => s.trim())
    if (k && v) acc[k] = v
    return acc
  }, {})

  const ts = parts.ts
  const providedV1 = parts.v1

  if (!ts || !providedV1) return false

  // Rejeitar timestamps muito antigos (replay protection: 5 min)
  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum)) return false
  const ageMs = Date.now() - tsNum * 1000
  if (ageMs > 5 * 60 * 1000 || ageMs < -60 * 1000) {
    return false
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expectedHmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHmac, 'hex'),
      Buffer.from(providedV1, 'hex')
    )
  } catch (_) {
    return false
  }
}

async function settleMercadoPagoPayment(localPayment, providerPayment, approvedBy = 'mercadopago') {
  const user = await userRepository.findById(localPayment.userId)
  if (!user) {
    throw new Error('Usuário do pagamento não encontrado.')
  }

  if (providerPayment.status === 'paid') {
    const updatedUser = await userRepository.updateUser(user.id, (current) =>
      applyPaymentProfile(current, localPayment.plan, {
        amount: localPayment.amount,
        paidAt: providerPayment.paidAt || new Date().toISOString(),
      })
    )

    const access = buildAccessSummary(updatedUser)
    const updatedPayment = await paymentRepository.updatePayment(localPayment.id, (current) => ({
      ...current,
      status: 'paid',
      provider: 'mercadopago',
      providerStatus: providerPayment.rawStatus,
      providerPaymentId: providerPayment.providerPaymentId,
      method: current.method || providerPayment.method || current.preferredMethod,
      paidAt: providerPayment.paidAt || current.paidAt || new Date().toISOString(),
      validUntil: access.expiresAt,
      recordedBy: approvedBy,
      rawProviderPayload: providerPayment.raw,
    }))

    // Registrar indicação se pagamento tinha cupom
    if (localPayment.cupomCodigo) {
      try {
        await cuponsController.registrarIndicacaoPaga({
          codigoCupom: localPayment.cupomCodigo,
          usuarioId: updatedUser.id,
          usuarioEmail: updatedUser.email,
          paymentId: updatedPayment.id,
          plano: localPayment.plan,
          valorPagoLiquido: localPayment.amount,
        })
      } catch (error) {
        console.error('[payment/settle/cupom]', error)
      }
    }

    let notifications = []
    try {
      notifications = await notifyContractRelease({
        user: updatedUser,
        payment: updatedPayment,
        access,
        approvedBy,
      })
    } catch (error) {
      console.error('[payment/settle/email]', error)
    }

    return {
      user: userRepository.sanitizeUser(updatedUser),
      access,
      payment: updatedPayment,
      notifications,
    }
  }

  const updatedPayment = await paymentRepository.updatePayment(localPayment.id, (current) => ({
    ...current,
    status: providerPayment.status === 'rejected' ? 'rejected' : 'processing',
    provider: 'mercadopago',
    providerStatus: providerPayment.rawStatus,
    providerPaymentId: providerPayment.providerPaymentId,
    method: current.method || providerPayment.method || current.preferredMethod,
    rawProviderPayload: providerPayment.raw,
    recordedBy: approvedBy,
  }))

  if (providerPayment.status === 'rejected') {
    await userRepository.updateUser(user.id, (current) => ({
      ...current,
      paymentStatus: 'rejected',
      subscriptionStatus: current.accessReleasedUntil ? current.subscriptionStatus : 'past_due',
      subscriptionRequestedPlan: null,
      requestedAt: null,
    }))
  }

  return {
    user: userRepository.sanitizeUser(await userRepository.findById(user.id)),
    access: buildAccessSummary(await userRepository.findById(user.id)),
    payment: updatedPayment,
    notifications: [],
  }
}

async function handleMercadoPagoWebhook(req, res) {
  try {
    // HIGH-01: Aceitar apenas body.data.id (confiável após HMAC)
    const paymentId = String(req.body?.data?.id || '').trim()
    const topic = String(req.body?.type || req.body?.topic || '').trim().toLowerCase()

    if (!paymentId || (topic && topic !== 'payment')) {
      return res.status(202).json({ received: true, ignored: true })
    }

    // CRIT-02: Validação HMAC
    if (!verifyMercadoPagoSignature(req, paymentId)) {
      console.warn('[payments/webhook] Assinatura HMAC inválida — rejeitando')
      return res.status(401).json({ received: false, message: 'Assinatura inválida.' })
    }

    const providerPayment = await getPaymentById(paymentId)
    const localReference = providerPayment.reference
    if (!localReference) {
      return res.status(202).json({ received: true, ignored: true, reason: 'external_reference_ausente' })
    }

    const localPayment = await paymentRepository.findPaymentById(localReference)
    if (!localPayment) {
      return res.status(202).json({ received: true, ignored: true, reason: 'pagamento_local_nao_encontrado' })
    }

    // Defesa adicional: garantir que o valor pago bate com o valor esperado
    if (Number(providerPayment.amount || 0) > 0 && Number(localPayment.amount || 0) > 0) {
      const diff = Math.abs(Number(providerPayment.amount) - Number(localPayment.amount))
      if (diff > 0.02) {
        console.warn(`[payments/webhook] Valor pago diverge (esperado: ${localPayment.amount}, recebido: ${providerPayment.amount})`)
        return res.status(202).json({ received: true, ignored: true, reason: 'valor_divergente' })
      }
    }

    await settleMercadoPagoPayment(localPayment, providerPayment, 'mercadopago_webhook')
    return res.status(200).json({ received: true, updated: true })
  } catch (error) {
    console.error('[payments/mercadopago/webhook]', error)
    return res.status(500).json({ message: 'Erro ao processar webhook do Mercado Pago.' })
  }
}

module.exports = {
  handleMercadoPagoWebhook,
  settleMercadoPagoPayment,
}
