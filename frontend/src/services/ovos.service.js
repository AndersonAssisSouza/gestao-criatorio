import api from './api'

export const ovosService = {
  async listar() {
    const { data } = await api.get('/api/ovos')
    return data
  },

  async criar(payload) {
    const { data } = await api.post('/api/ovos', payload)
    return data
  },

  async reiniciarNinhada(payload) {
    const { data } = await api.post('/api/ovos/restart-clutch', payload)
    return data
  },

  async atualizarStatus(id, payload) {
    const { data } = await api.post(`/api/ovos/${id}/status`, payload)
    return data
  },
}
