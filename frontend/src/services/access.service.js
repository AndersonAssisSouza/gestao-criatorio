import api from './api'
import { SUBSCRIPTION_PRICING } from '../config/subscription'

const USE_MOCK = !import.meta.env.VITE_API_URL

/* ──────────────────────────────────────────────
   Helpers de persistência mock (sessionStorage)
   ────────────────────────────────────────────── */
const STORAGE_KEY = 'plumar_mock_access'
const PAYMENTS_KEY = 'plumar_mock_payments'
const USERS_KEY = 'plumar_mock_users'

function readJson(key, fallback) {
  try { return JSON.parse(window.sessionStorage.getItem(key)) || fallback }
  catch { return fallback }
}
function writeJson(key, value) {
  window.sessionStorage.setItem(key, JSON.stringify(value))
}

function addDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
function addMonths(iso, months) {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}
function addYears(iso, years) {
  const d = new Date(iso)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString()
}

function getMyMockAccess() {
  const stored = readJson(STORAGE_KEY, null)
  if (stored) return stored

  const now = new Date().toISOString()
  const trialEnd = addDays(now, 7)
  const defaults = {
    accessGranted: true,
    status: 'trialing',
    plan: 'trial',
    label: 'Teste grátis',
    expiresAt: trialEnd,
    remainingDays: 7,
    requestedPlan: null,
    paymentStatus: 'trial',
  }
  writeJson(STORAGE_KEY, defaults)
  return defaults
}

function setMyMockAccess(patch) {
  const current = getMyMockAccess()
  const updated = { ...current, ...patch }
  writeJson(STORAGE_KEY, updated)
  syncMockUser(updated)
  return updated
}

function syncMockUser(access) {
  try {
    const raw = window.sessionStorage.getItem('plumar_mock_user')
    if (!raw) return
    const user = JSON.parse(raw)
    user.access = access
    window.sessionStorage.setItem('plumar_mock_user', JSON.stringify(user))
  } catch { /* noop */ }
}

function getMockPayments() {
  return readJson(PAYMENTS_KEY, [])
}
function addMockPayment(payment) {
  const payments = getMockPayments()
  payments.unshift(payment)
  writeJson(PAYMENTS_KEY, payments)
  return payment
}
function updateMockPayment(id, patch) {
  const payments = getMockPayments()
  const idx = payments.findIndex(p => p.id === id)
  if (idx >= 0) payments[idx] = { ...payments[idx], ...patch }
  writeJson(PAYMENTS_KEY, payments)
  return payments[idx] || null
}
function removeMockPayment(id) {
  const payments = getMockPayments().filter(p => p.id !== id)
  writeJson(PAYMENTS_KEY, payments)
}

/* ──────────────────────────────────────────────
   Mock: lista de usuários demo (para Proprietário)
   ────────────────────────────────────────────── */
function getMockUsers() {
  const defaults = [
    {
      id: 'demo-user-1',
      name: 'João Silva',
      email: 'joao@exemplo.com',
      role: 'user',
      subscriptionRequestedPlan: null,
      access: {
        accessGranted: true,
        status: 'trialing',
        plan: 'trial',
        label: 'Teste grátis',
        expiresAt: addDays(new Date().toISOString(), 3),
        remainingDays: 3,
        requestedPlan: null,
        paymentStatus: 'trial',
      },
    },
    {
      id: 'demo-user-2',
      name: 'Maria Oliveira',
      email: 'maria@exemplo.com',
      role: 'user',
      subscriptionRequestedPlan: 'monthly',
      access: {
        accessGranted: false,
        status: 'expired',
        plan: 'trial',
        label: 'Teste expirado',
        expiresAt: addDays(new Date().toISOString(), -2),
        remainingDays: 0,
        requestedPlan: 'monthly',
        paymentStatus: 'trial',
      },
    },
  ]
  const stored = readJson(USERS_KEY, null)
  if (stored) return stored
  writeJson(USERS_KEY, defaults)
  return defaults
}

function updateMockUser(userId, patch) {
  const users = getMockUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx >= 0) {
    if (patch.access) users[idx].access = { ...users[idx].access, ...patch.access }
    Object.keys(patch).filter(k => k !== 'access').forEach(k => { users[idx][k] = patch[k] })
  }
  writeJson(USERS_KEY, users)
  return users[idx] || null
}

/* ──────────────────────────────────────────────
   Cálculos de plano
   ────────────────────────────────────────────── */
function buildAccessFromPlan(plan, paidAt) {
  const now = paidAt || new Date().toISOString()
  if (plan === 'monthly') {
    const end = addMonths(now, 1)
    return {
      accessGranted: true,
      status: 'active',
      plan: 'monthly',
      label: 'Ativo',
      expiresAt: end,
      remainingDays: 30,
      requestedPlan: null,
      paymentStatus: 'paid',
    }
  }
  if (plan === 'annual') {
    const end = addYears(now, 1)
    return {
      accessGranted: true,
      status: 'active',
      plan: 'annual',
      label: 'Ativo',
      expiresAt: end,
      remainingDays: 365,
      requestedPlan: null,
      paymentStatus: 'paid',
    }
  }
  return {
    accessGranted: true,
    status: 'lifetime',
    plan: 'lifetime',
    label: 'Vitalício',
    expiresAt: null,
    remainingDays: null,
    requestedPlan: null,
    paymentStatus: 'waived',
  }
}

/* ──────────────────────────────────────────────
   Mock service implementations
   ────────────────────────────────────────────── */
const mockAccessService = {
  async getMyAccess() {
    return {
      payments: getMockPayments(),
      checkout: { configured: false, provider: 'interno', reasons: [] },
    }
  },

  async requestSubscription(plan) {
    setMyMockAccess({ requestedPlan: plan })
    return { user: { access: getMyMockAccess() } }
  },

  async createCheckout(payload) {
    const { plan, method } = payload
    const amount = SUBSCRIPTION_PRICING[plan] ?? 0
    const now = new Date().toISOString()
    const paymentId = `PAY-${Date.now().toString(36).toUpperCase()}`

    if (method === 'card') {
      const paidAt = now
      const access = buildAccessFromPlan(plan, paidAt)
      setMyMockAccess(access)

      const payment = addMockPayment({
        id: paymentId,
        userId: 'mock-owner',
        plan,
        amount,
        method: 'card',
        status: 'paid',
        paidAt,
        validUntil: access.expiresAt,
        createdAt: now,
        recordedBy: 'checkout_cartao_interno',
        cardBrand: 'Visa',
        cardMasked: '**** **** **** 4242',
        paymentReference: paymentId,
      })

      return {
        payment,
        checkout: { configured: false, provider: 'interno', redirectUrl: null, reasons: [] },
      }
    }

    // PIX
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${paymentId}520400005303986540${amount.toFixed(2)}5802BR5913PLUMAR SYSTEM6009SAO PAULO62070503***6304`
    const pixExpires = addDays(now, 1)

    const payment = addMockPayment({
      id: paymentId,
      userId: 'mock-owner',
      plan,
      amount,
      method: 'pix',
      status: 'awaiting_payment',
      createdAt: now,
      pixCode,
      pixExpiresAt: pixExpires,
      paymentReference: paymentId,
    })

    return {
      payment,
      checkout: { configured: false, provider: 'interno', redirectUrl: null, reasons: [] },
    }
  },

  async confirmInternalPayment(paymentId) {
    const payments = getMockPayments()
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) throw { response: { data: { message: 'Pagamento não encontrado.' } } }

    const paidAt = new Date().toISOString()
    const access = buildAccessFromPlan(payment.plan, paidAt)
    setMyMockAccess(access)

    const updated = updateMockPayment(paymentId, {
      status: 'paid',
      paidAt,
      validUntil: access.expiresAt,
      recordedBy: 'checkout_interno_confirmado',
    })

    return { payment: updated, access }
  },

  async reconcileCheckout(payload) {
    return { payment: null, user: null }
  },

  async listSubscribers() {
    const users = getMockUsers()
    const payments = getMockPayments()
    return { users, payments }
  },

  async grantAccess(userId, payload) {
    const { plan, amount, notes } = payload
    const paidAt = new Date().toISOString()
    const access = buildAccessFromPlan(plan, paidAt)
    const user = updateMockUser(userId, { access, subscriptionRequestedPlan: null })

    const payment = addMockPayment({
      id: `MANUAL-${Date.now().toString(36).toUpperCase()}`,
      userId,
      plan,
      amount: amount || SUBSCRIPTION_PRICING[plan] || 0,
      method: 'manual',
      status: 'paid',
      paidAt,
      validUntil: access.expiresAt,
      createdAt: paidAt,
      recordedBy: 'proprietario',
      notes,
      paymentReference: `MANUAL-${Date.now().toString(36).toUpperCase()}`,
    })

    return { user, payment }
  },

  async approvePayment(paymentId) {
    const paidAt = new Date().toISOString()
    const payment = getMockPayments().find(p => p.id === paymentId)
    if (!payment) throw { response: { data: { message: 'Pagamento não encontrado.' } } }
    const access = buildAccessFromPlan(payment.plan, paidAt)
    updateMockPayment(paymentId, { status: 'paid', paidAt, validUntil: access.expiresAt, recordedBy: 'proprietario' })
    if (payment.userId && payment.userId !== 'mock-owner') {
      updateMockUser(payment.userId, { access })
    }
    return { payment: { ...payment, status: 'paid', paidAt } }
  },

  async rejectPayment(paymentId) {
    const payment = getMockPayments().find(p => p.id === paymentId)
    if (!payment) throw { response: { data: { message: 'Pagamento não encontrado.' } } }
    updateMockPayment(paymentId, { status: 'rejected', rejectedAt: new Date().toISOString() })
    return { payment: { ...payment, status: 'rejected' } }
  },

  async extendTrial(userId, days) {
    const users = getMockUsers()
    const user = users.find(u => u.id === userId)
    if (!user) throw { response: { data: { message: 'Usuário não encontrado.' } } }

    const now = new Date().toISOString()
    const currentEnd = user.access?.expiresAt || now
    const baseDate = new Date(currentEnd) > new Date(now) ? currentEnd : now
    const newEnd = addDays(baseDate, days)

    const access = {
      accessGranted: true,
      status: 'trialing',
      plan: 'trial',
      label: 'Teste grátis',
      expiresAt: newEnd,
      remainingDays: days,
      requestedPlan: null,
      paymentStatus: 'trial',
    }
    updateMockUser(userId, { access })
    return { user: { ...user, access }, trialEndsAt: newEnd, daysAdded: days }
  },

  async deletePayment(paymentId) {
    const payment = getMockPayments().find(p => p.id === paymentId)
    if (!payment) throw { response: { data: { message: 'Pagamento não encontrado.' } } }
    removeMockPayment(paymentId)
    return { deleted: true }
  },

  async importMySharePointData() {
    return { message: 'Mock: importação simulada.' }
  },

  async getImportedSharePointData() {
    return { snapshot: null }
  },
}

/* ──────────────────────────────────────────────
   Real service (backend API)
   ────────────────────────────────────────────── */
const realAccessService = {
  async getMyAccess() {
    const { data } = await api.get('/api/access/me')
    return data
  },

  async requestSubscription(plan) {
    const { data } = await api.post('/api/access/request', { plan })
    return data
  },

  async createCheckout(payload) {
    const { data } = await api.post('/api/access/checkout', payload)
    return data
  },

  async confirmInternalPayment(paymentId) {
    const { data } = await api.post(`/api/access/checkout/${paymentId}/confirm`)
    return data
  },

  async reconcileCheckout(payload) {
    const { data } = await api.post('/api/access/checkout/reconcile', payload)
    return data
  },

  async listSubscribers() {
    const { data } = await api.get('/api/access/admin/subscribers')
    return data
  },

  async grantAccess(userId, payload) {
    const { data } = await api.post(`/api/access/admin/subscribers/${userId}/grant`, payload)
    return data
  },

  async approvePayment(paymentId, payload = {}) {
    const { data } = await api.post(`/api/access/admin/payments/${paymentId}/approve`, payload)
    return data
  },

  async rejectPayment(paymentId, payload = {}) {
    const { data } = await api.post(`/api/access/admin/payments/${paymentId}/reject`, payload)
    return data
  },

  async extendTrial(userId, days) {
    const { data } = await api.post(`/api/access/admin/subscribers/${userId}/extend-trial`, { days })
    return data
  },

  async deletePayment(paymentId) {
    const { data } = await api.delete(`/api/access/admin/payments/${paymentId}`)
    return data
  },

  async importMySharePointData() {
    const { data } = await api.post('/api/sharepoint/me/import')
    return data
  },

  async getImportedSharePointData() {
    const { data } = await api.get('/api/sharepoint/me/snapshot')
    return data
  },
}

export const accessService = USE_MOCK ? mockAccessService : realAccessService
