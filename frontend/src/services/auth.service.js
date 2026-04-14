import api from './api'

const USE_MOCK = !import.meta.env.VITE_API_URL

function buildMockUser(email, name) {
  const isOwner = email === 'admin@plumar.com' || email === 'admin' || email === 'anderson'

  if (isOwner) {
    return {
      id: '50e3b170-5e31-4cfb-99a1-b96d83c918a8',
      name: name || 'Anderson Assis',
      email: email || 'admin@plumar.com',
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
  }

  const now = new Date().toISOString()
  const trialEnd = new Date(Date.now() + 7 * 86400000).toISOString()
  // Sincroniza com o mock de acesso
  const access = {
    accessGranted: true,
    status: 'trialing',
    plan: 'trial',
    label: 'Teste grátis',
    expiresAt: trialEnd,
    remainingDays: 7,
    requestedPlan: null,
    paymentStatus: 'trial',
  }
  try { window.sessionStorage.setItem('plumar_mock_access', JSON.stringify(access)) } catch {}
  return {
    id: 'mock-user-' + Date.now().toString(36),
    name: name || email.split('@')[0],
    email,
    role: 'user',
    access,
  }
}

const MOCK_USER = buildMockUser('admin@plumar.com', 'Anderson Assis')

const mockAuth = {
  async login(email, password) {
    if (!email || !password) throw { response: { data: { message: 'Preencha e-mail e senha.' } } }
    return { user: buildMockUser(email, email.split('@')[0]) }
  },
  async register(name, email, password) {
    return { user: buildMockUser(email, name) }
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

const TOKEN_KEY = 'plumar_token'

function saveToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

// Injeta o Bearer token em todas as requests
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const realAuth = {
  async login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password })
    if (data.token) saveToken(data.token)
    return data
  },
  async register(name, email, password) {
    const { data } = await api.post('/api/auth/register', { name, email, password })
    if (data.token) saveToken(data.token)
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
    try { await api.post('/api/auth/logout') } catch (_) {}
    clearToken()
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
