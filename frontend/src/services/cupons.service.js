import api from './api'

const USE_MOCK = !import.meta.env.VITE_API_URL

const mock = {
  async validate() { return { valido: false, message: 'Mock sem cupons.' } },
  async ranking() { return { top: [], stats: { totalCaptadores: 0, totalIndicacoes: 0 } } },
  async payoutRequests() { return { pedidos: [], pendentes: [], totalPendentes: 0, totalValorPendente: 0 } },
  async listAdmin() { return { items: [], tiers: {}, rules: {} } },
  async detalhes() { return null },
  async create() { return null },
  async update() { return null },
  async remove() { return null },
  async payout() { return null },
  async meuPrograma() { return { programas: [], rules: {}, tiers: {} } },
  async solicitarPayout() { return { message: 'Mock' } },
}

const real = {
  async validate(codigo, plano) {
    const { data } = await api.get('/api/cupons/validar', { params: { codigo, plano } })
    return data
  },
  async ranking() {
    const { data } = await api.get('/api/cupons/ranking')
    return data
  },
  async payoutRequests() {
    const { data } = await api.get('/api/cupons/payout-requests')
    return data
  },
  async listAdmin() {
    const { data } = await api.get('/api/cupons')
    return data
  },
  async detalhes(id) {
    const { data } = await api.get(`/api/cupons/${id}`)
    return data
  },
  async create(payload) {
    const { data } = await api.post('/api/cupons', payload)
    return data
  },
  async update(id, payload) {
    const { data } = await api.put(`/api/cupons/${id}`, payload)
    return data
  },
  async remove(id) {
    const { data } = await api.delete(`/api/cupons/${id}`)
    return data
  },
  async payout(id, payload) {
    const { data } = await api.post(`/api/cupons/${id}/payout`, payload)
    return data
  },
  async meuPrograma() {
    const { data } = await api.get('/api/cupons/meu-programa')
    return data
  },
  async solicitarPayout(cupomId, valor) {
    const { data } = await api.post(`/api/cupons/meu-programa/${cupomId}/solicitar-payout`, { valor })
    return data
  },
}

export const cuponsService = USE_MOCK ? mock : real
