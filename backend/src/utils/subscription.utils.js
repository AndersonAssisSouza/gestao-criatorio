const { TRIAL_DAYS, FREE_TIER_LIMITS } = require('../config/subscription.config')

// Lazy getters — em Cloudflare Workers process.env não está populado no require()
// do bundle; só dentro do handler da request. Avaliar eager aqui deixa as
// constantes como string vazia em produção e quebra o owner bootstrap.
function cleanEnv(raw) {
  return String(raw ?? '').replace(/[\r\n]+$/g, '').trim()
}
function getOwnerEmail() {
  return cleanEnv(process.env.OWNER_EMAIL).toLowerCase()
}
function getOwnerName() {
  return cleanEnv(process.env.OWNER_NAME) || 'Anderson Assis'
}
function getOwnerAccessKey() {
  return cleanEnv(process.env.OWNER_ACCESS_KEY) || 'anderson'
}
function getOwnerPassword() {
  return cleanEnv(process.env.OWNER_PASSWORD)
}

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
    trialEndsAt: addDays(now, TRIAL_DAYS),
    accessReleasedUntil: addDays(now, TRIAL_DAYS),
    currentPeriodStart: now,
    currentPeriodEnd: addDays(now, TRIAL_DAYS),
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
      tier: 'full',
      limited: false,
      limits: null,
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
  const withinPaidPeriod = expiresAt ? expiresMs >= now : false

  let status = user.subscriptionStatus || 'trialing'
  let label = 'Em avaliação'
  let tier = 'full'
  let limited = false
  let accessGranted = withinPaidPeriod

  if (status === 'trialing') {
    if (withinPaidPeriod) {
      tier = 'trial'
      label = 'Teste grátis'
    } else {
      // Trial expirou sem assinatura → tier limitado (1 gaiola, 2 aves, 1 ninhada)
      tier = 'limited'
      limited = true
      accessGranted = true
      label = 'Acesso limitado'
      status = 'free_limited'
    }
  } else if (status === 'active') {
    tier = 'full'
    label = accessGranted ? 'Ativo' : 'Vencido'
    if (!accessGranted) {
      tier = 'limited'
      limited = true
      accessGranted = true
      status = 'free_limited'
      label = 'Acesso limitado'
    }
  } else if (status === 'cancelled') {
    if (withinPaidPeriod) {
      tier = 'full'
      label = 'Cancelada — ativa até o fim do período'
    } else {
      tier = 'limited'
      limited = true
      accessGranted = true
      status = 'free_limited'
      label = 'Acesso limitado'
    }
  } else if (status === 'pending_review') {
    label = 'Aguardando aprovação'
  } else if (status === 'past_due') {
    label = 'Pagamento pendente'
  }

  if (user.paymentStatus === 'awaiting_payment') label = 'PIX aguardando quitação'
  if (user.paymentStatus === 'redirect_pending') label = 'Checkout iniciado'
  if (user.paymentStatus === 'processing') label = 'Pagamento em análise'
  if (user.paymentStatus === 'rejected') label = 'Pagamento recusado'

  return {
    accessGranted,
    tier,
    limited,
    limits: limited ? { ...FREE_TIER_LIMITS } : null,
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
  const email = getOwnerEmail()
  const password = getOwnerPassword()
  if (!email || !password) {
    return null
  }

  return {
    name: getOwnerName(),
    email,
    password,
    role: 'owner',
    accessKey: getOwnerAccessKey(),
  }
}

function isOwnerEmail(email = '') {
  const owner = getOwnerEmail()
  return Boolean(owner) && String(email).trim().toLowerCase() === owner
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
