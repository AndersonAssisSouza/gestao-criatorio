import api from './api'

const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_USER = {
  id: '50e3b170-5e31-4cfb-99a1-b96d83c918a8',
  name: 'Anderson Assis',
  email: 'admin@plumar.com',
  role: 'owner',
  access: {
    accessGranted: true,
    label: 'Vitalício',
    status: 'active',
    plan: 'lifetime',
    expiresAt: null,
    remainingDays: null,
  },
}

const mockAuth = {
  async login(email, password) {
    if (!email || !password) throw { response: { data: { message: 'Preencha e-mail e senha.' } } }
    return { user: { ...MOCK_USER, email, name: email.split('@')[0] } }
  },
  async register(name, email, password) {
    return { user: { ...MOCK_USER, name, email } }
  },
  async me() {
    const stored = window.sessionStorage.getItem('plumar_mock_user')
    if (stored) return { user: JSON.parse(stored) }
    throw { response: { status: 401 } }
  },
  async forgotPassword(email) {
    return { message: 'Instruções enviadas para ' + email }
  },
  async resetPassword(token, password) {
    return { message: 'Senha redefinida com sucesso.' }
  },
  async logout() {
    window.sessionStorage.removeItem('plumar_mock_user')
  },
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
  async forgotPassword(email) {
    const { data } = await api.post('/api/auth/forgot-password', { email })
    return data
  },
  async resetPassword(token, password) {
    const { data } = await api.post('/api/auth/reset-password', { token, password })
    return data
  },
  async logout() {
    await api.post('/api/auth/logout')
  },
}

function wrapMockLogin(backend) {
  const original = backend.login
  return {
    ...backend,
    async login(email, password) {
      const result = await original(email, password)
      window.sessionStorage.setItem('plumar_mock_user', JSON.stringify(result.user))
      return result
    },
    async register(name, email, password) {
      const result = await backend.register(name, email, password)
      window.sessionStorage.setItem('plumar_mock_user', JSON.stringify(result.user))
      return result
    },
  }
}

export const authService = USE_MOCK ? wrapMockLogin(mockAuth) : realAuth
