import api from './api'

export const plantelService = {
  async listar() {
    const { data } = await api.get('/api/plantel')
    return data // { items: [] }
  },

  async buscarPorId(id) {
    const { data } = await api.get(`/api/plantel/${id}`)
    return data // { item }
  },

  async criar(payload) {
    const { data } = await api.post('/api/plantel', payload)
    return data // { item }
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/api/plantel/${id}`, payload)
    return data // { item }
  },

  async remover(id) {
    const { data } = await api.delete(`/api/plantel/${id}`)
    return data // { success: true }
  },
}
