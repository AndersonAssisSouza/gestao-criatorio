import api from './api'

const USE_MOCK = true

const mockAuth = {
  async login(email, password) {
    await new Promise(r => setTimeout(r, 500))
    if (!email || !password) throw new Error('Email e senha obrigatórios')
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: { id: '1', name: email.split('@')[0], email, role: 'admin' }
    }
  },
  async register(name, email, password) {
    await new Promise(r => setTimeout(r, 500))
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: { id: '1', name, email, role: 'admin' }
    }
  },
  async me() {
    const stored = localStorage.getItem('gc_user')
    return { user: stored ? JSON.parse(stored) : null }
  }
}

const realAuth = {
  async login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password })
    return data
  },
  async register(name, email, password) {
    const { data } = await api.post('/api/auth/register', { name, email, password })
    return data
  },
  async me() {
    const { data } = await api.get('/api/auth/me')
    return data
  },
}

export const authService = USE_MOCK ? mockAuth : realAuth
