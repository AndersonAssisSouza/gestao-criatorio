import api from './api'

export const criatorioService = {
  async listarMeu() {
    const { data } = await api.get('/api/criatorios/me')
    return data
  },

  async criar(payload) {
    const { data } = await api.post('/api/criatorios/me', payload)
    return data
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/api/criatorios/me/${id}`, payload)
    return data
  },

  async remover(id) {
    const { data } = await api.delete(`/api/criatorios/me/${id}`)
    return data
  },
}
