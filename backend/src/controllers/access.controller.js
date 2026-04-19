const userRepository = require('../repositories/user.repository')
const paymentRepository = require('../repositories/payment.repository')
const { applyPaymentProfile, buildAccessSummary } = require('../utils/subscription.utils')
const { SUBSCRIPTION_PRICING } = require('../config/subscription.config')
const { createPixPayload, normalizePaymentMethod, validateCardCheckout } = require('../utils/payment.utils')
const { notifyContractRelease, notifyCancellation } = require('../services/subscription-notification.service')
const { getCheckoutAvailability } = require('../config/payment-gateway.config')
const { createCheckoutPreference, getPaymentById } = require('../services/mercadopago.service')
const cuponsRepository = require('../repositories/cupons.repository')
const cuponsController = require('./cupons.controller')
const { settleMercadoPagoPayment } = require('./payment.controller')

function serializeUser(user) {
  return {
    ...userRepository.sanitizeUser(user),
    access: buildAccessSummary(user),
  }
}

function normalizeRequestedPlan(plan = '') {
  return String(plan || '').trim().toLowerCase()
}

async function getMyAccess(req, res) {
  return res.json({
    user: serializeUser(req.currentUser),
    payments: await paymentRepository.listPaymentsByUser(req.currentUser.id),
    checkout: getCheckoutAvailability(),
  })
}

async function requestSubscription(req, res) {
  const plan = normalizeRequestedPlan(req.body?.plan)
  if (!['monthly', 'annual'].includes(plan)) {
    return res.status(400).json({ message: 'Plano inválido. Escolha mensal ou anual.' })
  }

  const updatedUser = await userRepository.updateUser(req.currentUser.id, (user) => ({
    ...user,
    subscriptionRequestedPlan: plan,
    requestedAt: new Date().toISOString(),
    subscriptionStatus: user.isLifetimeOwner ? 'lifetime' : 'pending_review',
    paymentStatus: user.isLifetimeOwner ? 'waived' : 'pending',
  }))

  return res.json({ user: serializeUser(updatedUser) })
}

async function createCheckout(req, res) {
  const plan = normalizeRequestedPlan(req.body?.plan)
  const method = normalizePaymentMethod(req.body?.method)

  if (!['monthly', 'annual'].includes(plan)) {
    return res.status(400).json({ message: 'Plano inválido. Escolha mensal ou anual.' })
  }

  if (!['pix', 'card'].includes(method)) {
    return res.status(400).json({ message: 'Forma de pagamento inválida. Use PIX ou cartão.' })
  }

  if (req.currentUser.role === 'owner') {
    return res.status(400).json({ message: 'A conta proprietária não precisa realizar pagamento.' })
  }

  const valorOriginal = SUBSCRIPTION_PRICING[plan] ?? 0
  let amount = valorOriginal
  let cupomAplicado = null
  let descontoAplicado = 0

  // 1) Cupom explícito no body tem prioridade
  let codigoCupom = String(req.body?.cupom || '').trim()

  // 2) Senão, tenta usar cupomReferenciador salvo no user (janela de 30 dias)
  if (!codigoCupom && req.currentUser?.cupomReferenciador) {
    const capturaEm = req.currentUser.cupomReferenciadorDataCaptura
    if (capturaEm) {
      const diasDesdeCaptura = (Date.now() - new Date(capturaEm).getTime()) / 86_400_000
      if (diasDesdeCaptura <= 30) {
        codigoCupom = req.currentUser.cupomReferenciador
      }
    }
  }

  if (codigoCupom) {
    const cupom = await cuponsRepository.findCupomByCodigo(codigoCupom)
    if (cupom && cupom.status === 'ativo') {
      const mesmoEmail = cupom.captadorEmail && cupom.captadorEmail === String(req.currentUser.email || '').toLowerCase()
      if (!mesmoEmail) {
        const preview = cuponsController.calcularDesconto(cupom, plan)
        amount = preview.valorFinal
        descontoAplicado = preview.desconto
        cupomAplicado = {
          codigo: cupom.codigo,
          captadorNome: cupom.captadorNome,
          descontoPercentual: cupom.descontoPercentual,
        }
      }
    }
  }

  const now = new Date().toISOString()
  const checkoutAvailability = getCheckoutAvailability()

  let paymentPayload = {
    userId: req.currentUser.id,
    customerName: req.currentUser.name,
    customerEmail: req.currentUser.email,
    plan,
    amount,
    valorOriginal,
    descontoAplicado,
    cupomCodigo: cupomAplicado?.codigo || null,
    method,
    status: checkoutAvailability.configured ? 'redirect_pending' : method === 'pix' ? 'awaiting_payment' : 'processing',
    initiatedAt: now,
    notes: cupomAplicado ? `Checkout com cupom ${cupomAplicado.codigo} (-${cupomAplicado.descontoPercentual}%).` : 'Checkout iniciado pelo próprio cliente.',
  }

  if (!checkoutAvailability.configured && method === 'pix') {
    paymentPayload = {
      ...paymentPayload,
      ...createPixPayload({ user: req.currentUser, plan, amount }),
    }
  }

  if (!checkoutAvailability.configured && method === 'card') {
    const validation = validateCardCheckout(req.body)
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message })
    }

    paymentPayload = {
      ...paymentPayload,
      ...validation.card,
      paymentReference: `CARD-${Date.now().toString(36).toUpperCase()}`,
    }
  }

  let payment = await paymentRepository.createPayment(paymentPayload)
  let checkout = {
    configured: checkoutAvailability.configured,
    provider: checkoutAvailability.provider,
    redirectUrl: null,
    reasons: checkoutAvailability.reasons,
  }
  let updatedUser

  if (checkoutAvailability.configured) {
    const preference = await createCheckoutPreference({
      payment,
      user: req.currentUser,
      method,
    })

    payment = await paymentRepository.updatePayment(payment.id, (current) => ({
      ...current,
      provider: 'mercadopago',
      providerStatus: 'preference_created',
      providerCheckoutId: preference.preferenceId,
      paymentReference: preference.preferenceId,
      checkoutUrl: preference.checkoutUrl,
      sandboxCheckoutUrl: preference.sandboxCheckoutUrl,
      preferredMethod: method,
    }))

    checkout = {
      configured: true,
      provider: 'mercadopago',
      redirectUrl: preference.checkoutUrl,
      preferenceId: preference.preferenceId,
      reasons: [],
    }
  } else if (method === 'card') {
    const paidAt = new Date().toISOString()
    updatedUser = await userRepository.updateUser(req.currentUser.id, (user) =>
      applyPaymentProfile(user, plan, { amount, paidAt })
    )
    const access = buildAccessSummary(updatedUser)

    payment = await paymentRepository.updatePayment(payment.id, (current) => ({
      ...current,
      status: 'paid',
      paidAt,
      validUntil: access.expiresAt,
      recordedBy: 'checkout_cartao_interno',
    }))

    // Registrar indicação se houver cupom
    if (cupomAplicado) {
      try {
        await cuponsController.registrarIndicacaoPaga({
          codigoCupom: cupomAplicado.codigo,
          usuarioId: updatedUser.id,
          usuarioEmail: updatedUser.email,
          paymentId: payment.id,
          plano: plan,
          valorPagoLiquido: amount,
        })
      } catch (error) {
        console.error('[access/createCheckout/card/cupom]', error)
      }
    }

    let notifications = []
    try {
      notifications = await notifyContractRelease({
        user: updatedUser,
        payment,
        access,
        approvedBy: 'checkout_cartao_interno',
      })
    } catch (error) {
      console.error('[access/createCheckout/card/email]', error)
    }

    return res.status(201).json({
      user: serializeUser(updatedUser),
      payment,
      checkout,
      access,
      notifications,
    })
  }

  updatedUser = await userRepository.updateUser(req.currentUser.id, (user) => ({
    ...user,
    subscriptionRequestedPlan: plan,
    requestedAt: now,
    subscriptionStatus: 'pending_review',
    paymentStatus: checkoutAvailability.configured ? 'redirect_pending' : method === 'pix' ? 'awaiting_payment' : 'processing',
  }))

  return res.status(201).json({
    user: serializeUser(updatedUser),
    payment,
    checkout,
  })
}

async function confirmInternalPayment(req, res) {
  const paymentId = String(req.params.paymentId || '').trim()
  const payment = await paymentRepository.findPaymentById(paymentId)

  if (!payment || payment.userId !== req.currentUser.id) {
    return res.status(404).json({ message: 'Cobrança não encontrada para esta conta.' })
  }

  if (payment.provider) {
    return res.status(409).json({ message: 'Esta cobrança é externa e deve ser confirmada pelo gateway.' })
  }

  if (payment.status === 'paid') {
    const refreshedUser = await userRepository.findById(req.currentUser.id)
    return res.json({
      payment,
      user: serializeUser(refreshedUser),
      access: buildAccessSummary(refreshedUser),
    })
  }

  if (!['awaiting_payment', 'processing'].includes(payment.status)) {
    return res.status(409).json({ message: 'Esta cobrança não pode mais ser confirmada.' })
  }

  const paidAt = new Date().toISOString()
  const updatedUser = await userRepository.updateUser(req.currentUser.id, (user) =>
    applyPaymentProfile(user, payment.plan, { amount: payment.amount, paidAt })
  )
  const access = buildAccessSummary(updatedUser)

  const updatedPayment = await paymentRepository.updatePayment(payment.id, (current) => ({
    ...current,
    status: 'paid',
    paidAt,
    validUntil: access.expiresAt,
    recordedBy: 'checkout_interno_confirmado',
  }))

  // Registrar indicação se pagamento tinha cupom
  if (payment.cupomCodigo) {
    try {
      await cuponsController.registrarIndicacaoPaga({
        codigoCupom: payment.cupomCodigo,
        usuarioId: updatedUser.id,
        usuarioEmail: updatedUser.email,
        paymentId: updatedPayment.id,
        plano: payment.plan,
        valorPagoLiquido: payment.amount,
      })
    } catch (error) {
      console.error('[access/confirmInternalPayment/cupom]', error)
    }
  }

  let notifications = []
  try {
    notifications = await notifyContractRelease({
      user: updatedUser,
      payment: updatedPayment,
      access,
      approvedBy: 'checkout_interno_confirmado',
    })
  } catch (error) {
    console.error('[access/confirmInternalPayment/email]', error)
  }

  return res.json({
    payment: updatedPayment,
    user: serializeUser(updatedUser),
    access,
    notifications,
  })
}

async function reconcileCheckout(req, res) {
  const providerPaymentId = String(req.body?.paymentId || '').trim()
  const externalReference = String(req.body?.externalReference || '').trim()

  if (!providerPaymentId && !externalReference) {
    return res.status(400).json({ message: 'Dados do checkout ausentes para conciliação.' })
  }

  const localPayment = externalReference
    ? await paymentRepository.findPaymentById(externalReference)
    : null

  if (!localPayment || localPayment.userId !== req.currentUser.id) {
    return res.status(404).json({ message: 'Pagamento não encontrado para esta conta.' })
  }

  if (!providerPaymentId) {
    return res.json({
      payment: localPayment,
      user: serializeUser(req.currentUser),
    })
  }

  const providerPayment = await getPaymentById(providerPaymentId)
  const settlement = await settleMercadoPagoPayment(localPayment, providerPayment, 'mercadopago_return')

  const refreshedUser = await userRepository.findById(req.currentUser.id)
  return res.json({
    payment: settlement.payment,
    user: serializeUser(refreshedUser),
    access: buildAccessSummary(refreshedUser),
    notifications: settlement.notifications,
  })
}

async function listSubscribers(req, res) {
  // MED-03: paginação para evitar exposição em massa
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const allUsers = await userRepository.readUsers()
  const allPayments = await paymentRepository.listPayments()

  const users = allUsers.slice(offset, offset + limit).map(serializeUser)
  // Pagamentos escopados aos users retornados
  const userIds = new Set(users.map((u) => u.id))
  const payments = allPayments.filter((p) => userIds.has(p.userId))

  return res.json({
    users,
    payments,
    pagination: {
      total: allUsers.length,
      limit,
      offset,
      hasMore: offset + limit < allUsers.length,
    },
  })
}

async function grantAccess(req, res) {
  const userId = req.params.userId
  const plan = normalizeRequestedPlan(req.body?.plan)
  const requestedAmount = Number(req.body?.amount || 0)
  const notes = String(req.body?.notes || '').trim()

  if (!['monthly', 'annual', 'lifetime'].includes(plan)) {
    return res.status(400).json({ message: 'Plano inválido para liberação.' })
  }

  const existingUser = await userRepository.findById(userId)
  if (!existingUser) {
    return res.status(404).json({ message: 'Usuário não encontrado.' })
  }

  const amount = requestedAmount > 0
    ? requestedAmount
    : SUBSCRIPTION_PRICING[plan] ?? 0

  const updatedUser = await userRepository.updateUser(userId, (user) =>
    applyPaymentProfile(user, plan, { amount, paidAt: new Date().toISOString() })
  )

  const access = buildAccessSummary(updatedUser)
  const payment = await paymentRepository.createPayment({
    userId,
    recordedBy: req.currentUser.email,
    plan,
    amount,
    method: req.body?.method || 'manual',
    customerName: existingUser.name,
    customerEmail: existingUser.email,
    paymentReference: req.body?.paymentReference || `MANUAL-${Date.now().toString(36).toUpperCase()}`,
    status: 'paid',
    paidAt: updatedUser.lastPaymentAt,
    validUntil: access.expiresAt,
    notes,
  })

  let notifications = []
  try {
    notifications = await notifyContractRelease({
      user: updatedUser,
      payment,
      access,
      approvedBy: req.currentUser.email,
    })
  } catch (error) {
    console.error('[access/grantAccess/email]', error)
  }

  return res.json({
    user: serializeUser(updatedUser),
    payment,
    notifications,
  })
}

async function approvePayment(req, res) {
  const paymentId = req.params.paymentId
  const notes = String(req.body?.notes || '').trim()

  const existingPayment = await paymentRepository.findPaymentById(paymentId)
  if (!existingPayment) {
    return res.status(404).json({ message: 'Pagamento não encontrado.' })
  }

  if (!['awaiting_payment', 'processing', 'pending'].includes(existingPayment.status)) {
    return res.status(409).json({ message: 'Este pagamento não pode mais ser aprovado.' })
  }

  const existingUser = await userRepository.findById(existingPayment.userId)
  if (!existingUser) {
    return res.status(404).json({ message: 'Usuário vinculado ao pagamento não encontrado.' })
  }

  const paidAt = new Date().toISOString()
  const updatedUser = await userRepository.updateUser(existingUser.id, (user) =>
    applyPaymentProfile(user, existingPayment.plan, { amount: existingPayment.amount, paidAt })
  )

  const access = buildAccessSummary(updatedUser)
  const payment = await paymentRepository.updatePayment(paymentId, (current) => ({
    ...current,
    status: 'paid',
    paidAt,
    validUntil: access.expiresAt,
    recordedBy: req.currentUser.email,
    notes: [current.notes, notes].filter(Boolean).join(' | '),
  }))

  // Registrar indicação se pagamento tinha cupom
  if (existingPayment.cupomCodigo) {
    try {
      await cuponsController.registrarIndicacaoPaga({
        codigoCupom: existingPayment.cupomCodigo,
        usuarioId: updatedUser.id,
        usuarioEmail: updatedUser.email,
        paymentId: payment.id,
        plano: existingPayment.plan,
        valorPagoLiquido: existingPayment.amount,
      })
    } catch (error) {
      console.error('[access/approvePayment/cupom]', error)
    }
  }

  let notifications = []
  try {
    notifications = await notifyContractRelease({
      user: updatedUser,
      payment,
      access,
      approvedBy: req.currentUser.email,
    })
  } catch (error) {
    console.error('[access/approvePayment/email]', error)
  }

  return res.json({
    user: serializeUser(updatedUser),
    payment,
    notifications,
  })
}

async function rejectPayment(req, res) {
  const paymentId = req.params.paymentId
  const reason = String(req.body?.reason || '').trim()

  const existingPayment = await paymentRepository.findPaymentById(paymentId)
  if (!existingPayment) {
    return res.status(404).json({ message: 'Pagamento não encontrado.' })
  }

  if (!['awaiting_payment', 'processing', 'pending'].includes(existingPayment.status)) {
    return res.status(409).json({ message: 'Este pagamento não pode mais ser recusado.' })
  }

  const existingUser = await userRepository.findById(existingPayment.userId)
  if (!existingUser) {
    return res.status(404).json({ message: 'Usuário vinculado ao pagamento não encontrado.' })
  }

  const userAccess = buildAccessSummary(existingUser)
  const updatedUser = await userRepository.updateUser(existingUser.id, (user) => ({
    ...user,
    subscriptionStatus: userAccess.accessGranted ? user.subscriptionStatus : 'past_due',
    subscriptionRequestedPlan: null,
    requestedAt: null,
    paymentStatus: 'rejected',
  }))

  const payment = await paymentRepository.updatePayment(paymentId, (current) => ({
    ...current,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    recordedBy: req.currentUser.email,
    notes: [current.notes, reason].filter(Boolean).join(' | '),
  }))

  return res.json({
    user: serializeUser(updatedUser),
    payment,
  })
}

async function extendTrial(req, res) {
  const userId = req.params.userId
  const days = Math.min(Math.max(Number(req.body?.days) || 7, 1), 365)

  const existingUser = await userRepository.findById(userId)
  if (!existingUser) {
    return res.status(404).json({ message: 'Usuário não encontrado.' })
  }

  const now = new Date().toISOString()
  const currentEnd = existingUser.trialEndsAt || existingUser.accessReleasedUntil || now
  const baseDate = new Date(currentEnd) > new Date(now) ? currentEnd : now
  const { addDays } = require('../utils/subscription.utils')
  const newEnd = addDays(baseDate, days)

  const updatedUser = await userRepository.updateUser(userId, (user) => ({
    ...user,
    subscriptionPlan: 'trial',
    subscriptionStatus: 'trialing',
    trialEndsAt: newEnd,
    accessReleasedUntil: newEnd,
    currentPeriodEnd: newEnd,
    paymentStatus: 'trial',
  }))

  return res.json({
    user: serializeUser(updatedUser),
    trialEndsAt: newEnd,
    daysAdded: days,
  })
}

async function cancelMySubscription(req, res) {
  try {
    const now = new Date().toISOString()
    const user = req.currentUser

    // Mantém acesso até o fim do período já pago
    const accessEnd = user.accessReleasedUntil || user.currentPeriodEnd || now
    const keepAccess = new Date(accessEnd) > new Date(now) ? accessEnd : now

    // Verifica direito de arrependimento (7 dias após último pagamento)
    const lastPayment = user.lastPaymentAt ? new Date(user.lastPaymentAt) : null
    const sevenDaysAfterPayment = lastPayment ? new Date(lastPayment.getTime() + 7 * 24 * 60 * 60 * 1000) : null
    const withinWithdrawalPeriod = sevenDaysAfterPayment && new Date(now) <= sevenDaysAfterPayment

    const updatedUser = await userRepository.updateUser(user.id, (current) => ({
      ...current,
      subscriptionStatus: 'cancelled',
      accessReleasedUntil: keepAccess,
      currentPeriodEnd: keepAccess,
      paymentStatus: 'cancelled',
      subscriptionRequestedPlan: null,
      requestedAt: null,
      cancelledAt: now,
      cancellationReason: req.body?.reason || '',
      withinWithdrawalPeriod: !!withinWithdrawalPeriod,
    }))

    // Enviar notificações de cancelamento
    try {
      await notifyCancellation({
        user: updatedUser,
        accessEnd: keepAccess,
        withinWithdrawalPeriod: !!withinWithdrawalPeriod,
        reason: req.body?.reason || '',
      })
    } catch (emailErr) {
      console.error('[access/cancel/email]', emailErr)
    }

    return res.json({
      user: serializeUser(updatedUser),
      cancellation: {
        accessUntil: keepAccess,
        withinWithdrawalPeriod: !!withinWithdrawalPeriod,
        message: withinWithdrawalPeriod
          ? `Cancelamento registrado. Você está dentro do prazo de arrependimento de 7 dias e pode solicitar reembolso. Seu acesso permanece ativo até ${new Date(keepAccess).toLocaleDateString('pt-BR')}.`
          : `Cancelamento registrado. Seu acesso permanece ativo até ${new Date(keepAccess).toLocaleDateString('pt-BR')}. Após essa data, o acesso será encerrado.`,
      },
    })
  } catch (error) {
    console.error('[access/cancel]', error)
    return res.status(500).json({ message: 'Erro ao processar cancelamento.' })
  }
}

async function revokeAccess(req, res) {
  const userId = req.params.userId

  const existingUser = await userRepository.findById(userId)
  if (!existingUser) {
    return res.status(404).json({ message: 'Usuário não encontrado.' })
  }

  const now = new Date().toISOString()
  const updatedUser = await userRepository.updateUser(userId, (user) => ({
    ...user,
    subscriptionPlan: user.subscriptionPlan || 'trial',
    subscriptionStatus: 'cancelled',
    accessReleasedUntil: now,
    currentPeriodEnd: now,
    paymentStatus: 'cancelled',
    subscriptionRequestedPlan: null,
    requestedAt: null,
    // MED-04: invalida sessões JWT ativas do user
    tokenVersion: Number(user.tokenVersion || 0) + 1,
  }))

  return res.json({ user: serializeUser(updatedUser) })
}

async function deletePayment(req, res) {
  const paymentId = req.params.paymentId

  const existingPayment = await paymentRepository.findPaymentById(paymentId)
  if (!existingPayment) {
    return res.status(404).json({ message: 'Pagamento não encontrado.' })
  }

  await paymentRepository.deletePayment(paymentId)
  return res.json({ deleted: true })
}

module.exports = {
  approvePayment,
  cancelMySubscription,
  confirmInternalPayment,
  createCheckout,
  deletePayment,
  extendTrial,
  revokeAccess,
  getMyAccess,
  grantAccess,
  listSubscribers,
  reconcileCheckout,
  rejectPayment,
  requestSubscription,
}
