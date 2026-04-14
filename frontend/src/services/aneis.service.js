import api from './api'

export const aneisService = {
  async listar() {
    const { data } = await api.get('/api/aneis')
    return data
  },

  async criar(payload) {
    const { data } = await api.post('/api/aneis', payload)
    return data
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/api/aneis/${id}`, payload)
    return data
  },

  async remover(id) {
    const { data } = await api.delete(`/api/aneis/${id}`)
    return data
  },
}
