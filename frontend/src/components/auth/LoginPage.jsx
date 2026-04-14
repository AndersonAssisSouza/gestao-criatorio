import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { BRAND } from '../../brand'
import { BrandMark } from '../shared/BrandMark'

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: '14px 15px',
  color: 'var(--text-main)',
  fontSize: 14,
  outline: 'none',
}

const LABEL_STYLE = {
  fontSize: 11,
  color: 'var(--text-faint)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const LINK_BUTTON_STYLE = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--accent-strong)',
  fontSize: 12,
  cursor: 'pointer',
  textDecoration: 'underline',
}

function getTokenFromLink(link = '') {
  try {
    const url = new URL(link)
    return url.searchParams.get('token') || ''
  } catch (_) {
    return ''
  }
}

export function LoginPage() {
  const { login, register, forgotPassword, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewResetLink, setPreviewResetLink] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token') || ''
    const queryMode = params.get('mode')

    if (token || queryMode === 'reset-password') {
      setMode('reset')
      setResetToken(token)
      setSuccess(token ? 'Link de recuperação carregado. Defina sua nova senha.' : '')
    }
  }, [])

  const isRegisterMode = mode === 'register'
  const isForgotMode = mode === 'forgot'
  const isResetMode = mode === 'reset'

  const screenCopy = useMemo(() => {
    if (isForgotMode) {
      return {
        title: 'Recuperar acesso',
        description: 'Informe o e-mail cadastrado para receber o link de redefinição da sua senha.',
        button: 'Enviar instruções',
      }
    }

    if (isResetMode) {
      return {
        title: 'Criar nova senha',
        description: 'Defina uma nova senha alfanumérica com pelo menos 8 caracteres.',
        button: 'Salvar nova senha',
      }
    }

    if (isRegisterMode) {
      return {
        title: 'Criar conta',
        description: 'Primeiro acesso com 7 dias gratuitos. Depois você escolhe o plano que faz mais sentido.',
        button: 'Criar conta e entrar',
      }
    }

    return {
      title: 'Entrar no sistema',
      description: BRAND.promise,
      button: 'Entrar no Sistema',
    }
  }, [isForgotMode, isRegisterMode, isResetMode])

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    if (nextMode !== 'reset') {
      setResetToken('')
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (isRegisterMode && (!name || !email || !password)) {
      setError('Preencha todos os campos.')
      return
    }

    if (isForgotMode && !email) {
      setError('Informe o e-mail cadastrado.')
      return
    }

    if (isResetMode) {
      if (!resetToken || !password || !confirmPassword) {
        setError('Preencha o token e a nova senha.')
        return
      }

      if (password !== confirmPassword) {
        setError('A confirmação da senha não confere.')
        return
      }
    }

    if (!isRegisterMode && !isForgotMode && !isResetMode && (!email || !password)) {
      setError('Preencha e-mail e senha.')
      return
    }

    setLoading(true)

    try {
      if (isRegisterMode) {
        await register(name, email, password)
      } else if (isForgotMode) {
        const response = await forgotPassword(email)
        setPreviewResetLink(response.previewResetLink || '')
        setSuccess(response.message || 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.')
      } else if (isResetMode) {
        const response = await resetPassword(resetToken, password)
        setSuccess(response.message || 'Senha redefinida com sucesso.')
        setPassword('')
        setConfirmPassword('')
        setResetToken('')
        setTimeout(() => switchMode('login'), 1200)
      } else {
        await login(email, password)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Não foi possível concluir a operação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-ambient" />
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 82,
            height: 82,
            borderRadius: 24,
            margin: '0 auto 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--accent-glow-soft), var(--support-soft))',
            boxShadow: '0 18px 40px var(--accent-glow-soft)',
          }}>
            <BrandMark size={62} compact />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            {BRAND.badge}
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>
            {BRAND.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            {BRAND.descriptor}
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent-copy)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>
            {screenCopy.description}
          </div>
        </div>

        {!isForgotMode && !isResetMode && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                borderRadius: 12,
                border: mode === 'login' ? '1px solid var(--accent-soft-strong)' : '1px solid rgba(255,255,255,0.08)',
                background: mode === 'login' ? 'rgba(201,80,37,0.12)' : 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)',
                padding: '12px 14px',
                cursor: 'pointer',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                borderRadius: 12,
                border: mode === 'register' ? '1px solid var(--accent-soft-strong)' : '1px solid rgba(255,255,255,0.08)',
                background: mode === 'register' ? 'rgba(201,80,37,0.12)' : 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)',
                padding: '12px 14px',
                cursor: 'pointer',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Criar conta
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 24, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
            {screenCopy.title}
          </div>

          {isRegisterMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL_STYLE}>Nome</label>
              <input
                style={INPUT_STYLE}
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {!isResetMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL_STYLE}>E-mail</label>
              <input
                style={INPUT_STYLE}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {isResetMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL_STYLE}>Token de recuperação</label>
              <input
                style={INPUT_STYLE}
                type="text"
                placeholder="Cole o token recebido"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {!isForgotMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL_STYLE}>{isResetMode ? 'Nova senha' : 'Senha'}</label>
              <input
                style={INPUT_STYLE}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {isResetMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL_STYLE}>Confirmar nova senha</label>
              <input
                style={INPUT_STYLE}
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {error && <div style={{ fontSize: 12, color: '#E05C4B' }}>{error}</div>}
          {!error && success && <div style={{ fontSize: 12, color: '#4CAF7D', lineHeight: 1.7 }}>{success}</div>}
          {!error && !success && isRegisterMode && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Use sempre um e-mail válido e uma senha com pelo menos 8 caracteres, letras e números.
            </div>
          )}

          {previewResetLink && isForgotMode && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Ambiente local sem SMTP configurado: você pode abrir a redefinição por este link de teste.
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  style={LINK_BUTTON_STYLE}
                  onClick={() => {
                    const token = getTokenFromLink(previewResetLink)
                    setResetToken(token)
                    setPreviewResetLink('')
                    switchMode('reset')
                  }}
                >
                  Usar link de recuperação neste ambiente
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
              border: 'none',
              borderRadius: 14,
              padding: 14,
              color: 'var(--accent-ink)',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'DM Serif Display', serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 10px 26px var(--accent-glow)',
            }}
          >
            {loading ? 'Processando...' : screenCopy.button}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            {mode === 'login' && (
              <button type="button" style={LINK_BUTTON_STYLE} onClick={() => switchMode('forgot')}>
                Esqueci minha senha
              </button>
            )}

            {(isForgotMode || isResetMode) && (
              <button type="button" style={LINK_BUTTON_STYLE} onClick={() => switchMode('login')}>
                Voltar para o login
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {BRAND.tagline}
        </div>
      </div>
    </div>
  )
}
