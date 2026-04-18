const paymentRepository = require('../repositories/payment.repository')
const userRepository = require('../repositories/user.repository')
const { applyPaymentProfile, buildAccessSummary } = require('../utils/subscription.utils')
const { getPaymentById } = require('../services/mercadopago.service')
const { notifyContractRelease } = require('../services/subscription-notification.service')
const cuponsController = require('./cupons.controller')

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
    const paymentId = String(req.query['data.id'] || req.body?.data?.id || req.body?.id || '').trim()
    const topic = String(req.query.type || req.body?.type || req.body?.topic || '').trim().toLowerCase()

    if (!paymentId || (topic && topic !== 'payment')) {
      return res.status(202).json({ received: true, ignored: true })
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
