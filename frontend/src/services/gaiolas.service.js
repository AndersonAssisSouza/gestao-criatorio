import api from './api'

export const gaiolasService = {
  async listar() {
    const { data } = await api.get('/api/gaiolas')
    return data
  },

  async criar(payload) {
    const { data } = await api.post('/api/gaiolas', payload)
    return data
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/api/gaiolas/${id}`, payload)
    return data
  },

  async remover(id) {
    const { data } = await api.delete(`/api/gaiolas/${id}`)
    return data
  },
}
