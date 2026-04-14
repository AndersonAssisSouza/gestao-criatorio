import api from './api'

export const speciesService = {
  async list() {
    const { data } = await api.get('/api/species')
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/species', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/species/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/species/${id}`)
    return data
  },
}
