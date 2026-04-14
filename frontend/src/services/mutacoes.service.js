import api from './api'

export const mutacoesService = {
  async list() {
    const { data } = await api.get('/api/mutacoes')
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/mutacoes', payload)
    return data
  },
}
