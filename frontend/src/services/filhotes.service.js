import api from './api'

export const filhotesService = {
  async list() {
    const { data } = await api.get('/api/filhotes')
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/filhotes/${id}`, payload)
    return data
  },

  async markDeath(id) {
    const { data } = await api.post(`/api/filhotes/${id}/mark-death`)
    return data
  },

  async transferToPlantel(id, payload) {
    const { data } = await api.post(`/api/filhotes/${id}/transfer-to-plantel`, payload)
    return data
  },
}
