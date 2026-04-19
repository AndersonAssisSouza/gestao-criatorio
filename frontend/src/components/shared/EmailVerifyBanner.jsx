import { useState } from 'react'
import { authService } from '../../services/auth.service'

export function EmailVerifyBanner({ user }) {
  if (!user) return null
  // Apenas exibe se o campo existe e está explicitamente false
  if (user.emailVerified !== false) return null
  if (user.role === 'owner') return null

  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [feedback, setFeedback] = useState('')

  async function handleResend() {
    setStatus('sending')
    setFeedback('')
    try {
      const data = await authService.resendVerification()
      setStatus('sent')
      setFeedback(data?.message || 'E-mail reenviado. Confira sua caixa de entrada.')
    } catch (err) {
      setStatus('error')
      setFeedback(err?.response?.data?.message || 'Não foi possível reenviar agora.')
    }
  }

  return (
    <div
      style={{
        margin: '12px 16px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
        border: '1px solid #1976D2',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        color: '#0D47A1',
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <strong style={{ fontSize: 14 }}>✉️ Confirme seu e-mail</strong>
        <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.4 }}>
          Enviamos um link de confirmação para <strong>{user.email}</strong>.
          {feedback && <span style={{ display: 'block', marginTop: 4, fontWeight: 600 }}>{feedback}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={handleResend}
        disabled={status === 'sending' || status === 'sent'}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: 'none',
          background: status === 'sent' ? '#81C784' : '#1976D2',
          color: '#fff',
          fontWeight: 600,
          cursor: status === 'sending' || status === 'sent' ? 'default' : 'pointer',
          opacity: status === 'sending' ? 0.7 : 1,
        }}
      >
        {status === 'sending' ? 'Enviando...' : status === 'sent' ? 'Enviado' : 'Reenviar e-mail'}
      </button>
    </div>
  )
}
