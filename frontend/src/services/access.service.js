import api from './api'

export const accessService = {
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

  async importMySharePointData() {
    const { data } = await api.post('/api/sharepoint/me/import')
    return data
  },

  async getImportedSharePointData() {
    const { data } = await api.get('/api/sharepoint/me/snapshot')
    return data
  },
}
