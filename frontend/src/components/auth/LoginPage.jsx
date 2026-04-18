import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { BRAND } from '../../brand'
import { BrandMark } from '../shared/BrandMark'

function getTokenFromLink(link = '') {
  try {
    const url = new URL(link)
    return url.searchParams.get('token') || ''
  } catch (_) {
    return ''
  }
}

export function LoginPage({ onBackToLanding }) {
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
    if (isForgotMode) return { title: 'Recuperar acesso', description: 'Informe o e-mail cadastrado para receber o link de redefinição.', button: 'Enviar instruções' }
    if (isResetMode) return { title: 'Criar nova senha', description: 'Defina uma nova senha com pelo menos 8 caracteres.', button: 'Salvar nova senha' }
    if (isRegisterMode) return { title: 'Criar conta', description: 'Primeiro acesso com 30 dias gratuitos.', button: 'Criar conta e entrar' }
    return { title: 'Entrar no sistema', description: BRAND.promise, button: 'Entrar' }
  }, [isForgotMode, isRegisterMode, isResetMode])

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    if (nextMode !== 'reset') {
      setResetToken('')
      if (window.location.search) window.history.replaceState({}, '', window.location.pathname)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (isRegisterMode && (!name || !email || !password)) { setError('Preencha todos os campos.'); return }
    if (isForgotMode && !email) { setError('Informe o e-mail cadastrado.'); return }
    if (isResetMode) {
      if (!resetToken || !password || !confirmPassword) { setError('Preencha o token e a nova senha.'); return }
      if (password !== confirmPassword) { setError('A confirmação da senha não confere.'); return }
    }
    if (!isRegisterMode && !isForgotMode && !isResetMode && (!email || !password)) { setError('Preencha e-mail e senha.'); return }

    setLoading(true)
    try {
      if (isRegisterMode) {
        // Captura cupom de indicação (URL ou localStorage)
        const urlParams = new URLSearchParams(window.location.search)
        const cupomRef = (urlParams.get('cupom') || localStorage.getItem('plumar_cupom_ref') || '').trim().toUpperCase()
        await register(name, email, password, cupomRef ? { cupomReferenciador: cupomRef } : {})
      } else if (isForgotMode) {
        const response = await forgotPassword(email)
        setPreviewResetLink(response.previewResetLink || '')
        setSuccess(response.message || 'Se o e-mail estiver cadastrado, enviaremos as instruções.')
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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--accent-ghost)', border: '1px solid var(--accent-border)',
          }}>
            <BrandMark size={52} compact />
          </div>
          <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", color: 'var(--text-main)', marginBottom: 4 }}>
            {BRAND.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {BRAND.descriptor}
          </div>
        </div>

        {!isForgotMode && !isResetMode && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`p-btn ${mode === 'login' ? 'p-btn--primary' : 'p-btn--secondary'}`}
              style={{ justifyContent: 'center' }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`p-btn ${mode === 'register' ? 'p-btn--primary' : 'p-btn--secondary'}`}
              style={{ justifyContent: 'center' }}
            >
              Criar conta
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 4 }}>
            {screenCopy.description}
          </div>

          {isRegisterMode && (
            <div className="p-field">
              <label className="p-label">Nome</label>
              <input className="p-input" type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          {!isResetMode && (
            <div className="p-field">
              <label className="p-label">E-mail</label>
              <input className="p-input" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          {isResetMode && (
            <div className="p-field">
              <label className="p-label">Token de recuperação</label>
              <input className="p-input" type="text" placeholder="Cole o token recebido" value={resetToken} onChange={(e) => setResetToken(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          {!isForgotMode && (
            <div className="p-field">
              <label className="p-label">{isResetMode ? 'Nova senha' : 'Senha'}</label>
              <input className="p-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          {isResetMode && (
            <div className="p-field">
              <label className="p-label">Confirmar nova senha</label>
              <input className="p-input" type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          {error && <div className="p-alert p-alert--error">{error}</div>}
          {!error && success && <div className="p-alert p-alert--success">{success}</div>}

          {previewResetLink && isForgotMode && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Ambiente local sem SMTP:
              <button type="button" className="p-btn p-btn--ghost p-btn--sm" style={{ marginLeft: 6 }}
                onClick={() => { setResetToken(getTokenFromLink(previewResetLink)); setPreviewResetLink(''); switchMode('reset') }}>
                Usar link de recuperação
              </button>
            </div>
          )}

          <button className="p-btn p-btn--primary w-full mt-1" onClick={handleSubmit} disabled={loading}
            style={{ justifyContent: 'center', padding: '12px 18px', fontSize: 14 }}>
            {loading ? 'Processando...' : screenCopy.button}
          </button>

          <div className="flex justify-between gap-1" style={{ flexWrap: 'wrap' }}>
            {mode === 'login' && (
              <button type="button" className="p-btn p-btn--ghost p-btn--sm" onClick={() => switchMode('forgot')}>
                Esqueci minha senha
              </button>
            )}
            {(isForgotMode || isResetMode) && (
              <button type="button" className="p-btn p-btn--ghost p-btn--sm" onClick={() => switchMode('login')}>
                Voltar para o login
              </button>
            )}
          </div>
        </div>

        {onBackToLanding && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" className="p-btn p-btn--ghost p-btn--sm" onClick={onBackToLanding}
              style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ← Voltar para a página inicial
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {BRAND.tagline}
        </div>
      </div>
    </div>
  )
}
