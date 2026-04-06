import api from './api'

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password })
    return data // { token, user }
  },

  async register(name, email, password) {
    const { data } = await api.post('/api/auth/register', { name, email, password })
    return data // { token, user }
  },

  async me() {
    const { data } = await api.get('/api/auth/me')
    return data // { user }
  },
}
