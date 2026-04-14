const OWNER_EMAIL = (process.env.OWNER_EMAIL || '').trim().toLowerCase()
const OWNER_NAME = process.env.OWNER_NAME || 'Anderson Assis'
const OWNER_ACCESS_KEY = process.env.OWNER_ACCESS_KEY || 'anderson'

function toIso(value) {
  return new Date(value).toISOString()
}

function addDays(isoDate, days) {
  const date = new Date(isoDate)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

function addMonths(isoDate, months) {
  const date = new Date(isoDate)
  date.setMonth(date.getMonth() + months)
  return toIso(date)
}

function addYears(isoDate, years) {
  const date = new Date(isoDate)
  date.setFullYear(date.getFullYear() + years)
  return toIso(date)
}

function createTrialProfile(now = new Date().toISOString()) {
  return {
    subscriptionPlan: 'trial',
    subscriptionStatus: 'trialing',
    trialStartedAt: now,
    trialEndsAt: addDays(now, 7),
    accessReleasedUntil: addDays(now, 7),
    currentPeriodStart: now,
    currentPeriodEnd: addDays(now, 7),
    subscriptionRequestedPlan: null,
    requestedAt: null,
    lastPaymentAt: null,
    billingAmount: null,
    billingCycle: 'trial',
    paymentStatus: 'trial',
  }
}

function createLifetimeProfile(now = new Date().toISOString()) {
  return {
    subscriptionPlan: 'lifetime',
    subscriptionStatus: 'lifetime',
    trialStartedAt: now,
    trialEndsAt: null,
    accessReleasedUntil: null,
    currentPeriodStart: now,
    currentPeriodEnd: null,
    subscriptionRequestedPlan: null,
    requestedAt: null,
    lastPaymentAt: now,
    billingAmount: 0,
    billingCycle: 'lifetime',
    paymentStatus: 'waived',
    isLifetimeOwner: true,
  }
}

function applyPaymentProfile(user, plan, payment = {}) {
  const now = payment.paidAt || new Date().toISOString()
  const amount = Number(payment.amount || 0)
  const common = {
    subscriptionPlan: plan,
    subscriptionStatus: 'active',
    subscriptionRequestedPlan: null,
    requestedAt: null,
    lastPaymentAt: now,
    billingAmount: amount,
    paymentStatus: 'paid',
    currentPeriodStart: now,
  }

  if (plan === 'annual') {
    const end = addYears(now, 1)
    return {
      ...user,
      ...common,
      billingCycle: 'annual',
      accessReleasedUntil: end,
      currentPeriodEnd: end,
    }
  }

  if (plan === 'lifetime') {
    return {
      ...user,
      ...createLifetimeProfile(now),
      role: user.role === 'owner' ? 'owner' : user.role,
    }
  }

  const end = addMonths(now, 1)
  return {
    ...user,
    ...common,
    billingCycle: 'monthly',
    accessReleasedUntil: end,
    currentPeriodEnd: end,
  }
}

function buildAccessSummary(user) {
  const now = Date.now()

  if (user.isLifetimeOwner || user.subscriptionStatus === 'lifetime' || user.role === 'owner') {
    return {
      accessGranted: true,
      status: 'lifetime',
      plan: 'lifetime',
      label: 'Vitalício',
      expiresAt: null,
      remainingDays: null,
      requestedPlan: user.subscriptionRequestedPlan || null,
      paymentStatus: user.paymentStatus || 'waived',
    }
  }

  const expiresAt = user.accessReleasedUntil || user.trialEndsAt || null
  const expiresMs = expiresAt ? new Date(expiresAt).getTime() : 0
  const remainingDays = expiresAt ? Math.max(0, Math.ceil((expiresMs - now) / 86_400_000)) : 0
  const accessGranted = expiresAt ? expiresMs >= now : false

  let status = user.subscriptionStatus || 'trialing'
  let label = 'Em avaliação'

  if (status === 'trialing') label = accessGranted ? 'Teste grátis' : 'Teste expirado'
  if (status === 'pending_review') label = 'Aguardando aprovação'
  if (status === 'active') label = accessGranted ? 'Ativo' : 'Vencido'
  if (status === 'past_due') label = 'Pagamento pendente'

  if (user.paymentStatus === 'awaiting_payment') label = 'PIX aguardando quitação'
  if (user.paymentStatus === 'redirect_pending') label = 'Checkout iniciado'
  if (user.paymentStatus === 'processing') label = 'Pagamento em análise'
  if (user.paymentStatus === 'rejected') label = 'Pagamento recusado'

  if (!accessGranted && status === 'active') {
    status = 'expired'
  }

  return {
    accessGranted,
    status,
    plan: user.subscriptionPlan || 'trial',
    label,
    expiresAt,
    remainingDays,
    requestedPlan: user.subscriptionRequestedPlan || null,
    paymentStatus: user.paymentStatus || 'trial',
  }
}

function getOwnerSeed() {
  if (!OWNER_EMAIL || !process.env.OWNER_PASSWORD) {
    return null
  }

  return {
    name: OWNER_NAME,
    email: OWNER_EMAIL,
    password: process.env.OWNER_PASSWORD,
    role: 'owner',
    accessKey: OWNER_ACCESS_KEY,
  }
}

function isOwnerEmail(email = '') {
  return OWNER_EMAIL && String(email).trim().toLowerCase() === OWNER_EMAIL
}

module.exports = {
  addDays,
  addMonths,
  addYears,
  applyPaymentProfile,
  buildAccessSummary,
  createLifetimeProfile,
  createTrialProfile,
  getOwnerSeed,
  isOwnerEmail,
}
