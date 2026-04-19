import { useEffect, useState } from 'react'
import { authService } from '../../services/auth.service'
import { BRAND } from '../../brand'

export function EmailVerifyPage({ token, onContinue }) {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('Verificando seu e-mail...')

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) {
        setStatus('error')
        setMessage('Link de verificação inválido.')
        return
      }
      try {
        const data = await authService.verifyEmail(token)
        if (cancelled) return
        setStatus('success')
        setMessage(data?.message || 'E-mail verificado com sucesso.')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setMessage(err?.response?.data?.message || 'Não foi possível verificar o e-mail.')
      }
    }
    run()
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    document.title = `Verificação de e-mail • ${BRAND.name}`
  }, [])

  const color = status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--text-muted)'

  return (
    <div className="login-screen">
      <div className="login-ambient" />
      <div className="login-card" style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 12 }}>Verificação de e-mail</h1>
        <p style={{ color, marginBottom: 24 }}>{message}</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            // Limpa query params e volta para landing/login
            window.history.replaceState({}, '', window.location.pathname)
            onContinue?.()
          }}
          style={{ width: '100%' }}
        >
          {status === 'success' ? 'Continuar para o login' : 'Voltar'}
        </button>
      </div>
    </div>
  )
}
