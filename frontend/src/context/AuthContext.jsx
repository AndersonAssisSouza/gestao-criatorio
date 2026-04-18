import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    const data = await authService.me()
    setUser(data.user)
    return data.user
  }

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        const data = await authService.me()
        if (active) setUser(data.user)
      } catch (_) {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    const handleUnauthorized = () => setUser(null)
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      active = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    return data
  }

  const register = async (name, email, password, extras = {}) => {
    const data = await authService.register(name, email, password, extras)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (_) {
      // A limpeza local ainda precisa acontecer mesmo se o backend já tiver expirado a sessão.
    }
    setUser(null)
  }

  const forgotPassword = async (email) => {
    return authService.forgotPassword(email)
  }

  const resetPassword = async (token, password) => {
    return authService.resetPassword(token, password)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, forgotPassword, resetPassword, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
