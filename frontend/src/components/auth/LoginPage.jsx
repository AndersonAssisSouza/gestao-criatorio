import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function BirdIcon({ size = 20, color = '#D4A017' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12C3 12 8 6 12 8C16 10 17 7 21 6C21 6 18 12 15 12C12 12 11 14 9 15C7 16 5 15 3 12Z" fill={color} opacity="0.9"/>
      <path d="M9 15C9 15 8 18 6 19C7 19 10 18 11 16" fill={color} opacity="0.6"/>
    </svg>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Preencha todos os campos.'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch (e) {
      setError(e.response?.data?.message || 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #0A1A0C 0%, #102012 50%, #0D1A10 100%)',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'DM Serif Display', serif",
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,125,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        width: 400, padding: '48px 44px',
        background: 'rgba(21,40,24,0.9)',
        border: '1px solid rgba(212,160,23,0.2)', borderRadius: 16,
        backdropFilter: 'blur(20px)', zIndex: 2,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #D4A017, #B8870F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 26,
            boxShadow: '0 8px 24px rgba(212,160,23,0.4)',
          }}>
            <BirdIcon size={28} color="#0A1A0C" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#F2EDE4', marginBottom: 4 }}>Gestão Criatório</div>
          <div style={{ fontSize: 13, color: '#7A9E7C', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Sistema de Gestão Avícola
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['E-mail', 'Senha'].map((label, i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#7A9E7C', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </label>
              <input
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '12px 14px', color: '#F2EDE4',
                  fontSize: 14, fontFamily: "'DM Mono', monospace", outline: 'none',
                }}
                type={i === 0 ? 'email' : 'password'}
                placeholder={i === 0 ? 'seu@email.com' : '••••••••'}
                value={i === 0 ? email : password}
                onChange={e => i === 0 ? setEmail(e.target.value) : setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                onFocus={e => e.target.style.borderColor = 'rgba(212,160,23,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          ))}

          {error && <div style={{ fontSize: 12, color: '#E05C4B', fontFamily: "'DM Mono', monospace" }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #D4A017, #B8870F)',
              border: 'none', borderRadius: 8, padding: 13,
              color: '#0A1A0C', fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Serif Display', serif", cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8, opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(212,160,23,0.3)',
            }}
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#2A4A2C', fontFamily: "'DM Mono', monospace" }}>
          MVP v0.1 · Módulo Plantel ativo
        </div>
      </div>
    </div>
  )
}
