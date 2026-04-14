import { useAuth } from '../../context/AuthContext'
import { BRAND } from '../../brand'
import { BrandMark } from '../shared/BrandMark'

export const NAV_ITEMS = [
  { key: 'plantel', label: 'Plantel', available: true },
  { key: 'chocando', label: 'Aves em Choco', available: true },
  { key: 'gaiolas', label: 'Gaiolas', available: true },
  { key: 'filhotes', label: 'Filhotes', available: true },
  { key: 'especies', label: 'Espécies', available: true },
  { key: 'aviario', label: 'Criatórios', available: true },
  { key: 'aneis', label: 'Anéis', available: true },
  { key: 'financeiro', label: 'Financeiro', available: true },
  { key: 'explantel', label: 'Ex-Plantel', available: true },
  { key: 'mutacoes', label: 'Mutações', available: true },
  { key: 'assinatura', label: 'Minha assinatura', available: true },
  { key: 'proprietario', label: 'Área do proprietário', available: true },
  { key: 'configuracoes', label: 'Configurações', available: true },
]

export function Sidebar({ activePage, onNavigate, isOpen = true, onClose }) {
  const { user, logout } = useAuth()
  const userName = user?.name || user?.email?.split('@')[0] || 'Usuário'
  const initials = userName.slice(0, 2).toUpperCase()
  const hasOperationalAccess = user?.access?.accessGranted || user?.role === 'owner'
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'proprietario') return user?.role === 'owner'
    if (item.key === 'mutacoes') return user?.role === 'owner'
    if (item.key === 'assinatura' || item.key === 'configuracoes') return true
    return hasOperationalAccess
  })

  return (
    <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="app-sidebar__brand">
        <div className="app-sidebar__brand-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <BrandMark />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
                {BRAND.descriptor}
              </div>
              <div style={{ fontSize: 22, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>
                {BRAND.name}
              </div>
            </div>
          </div>
          <button type="button" className="app-sidebar__close" onClick={onClose} aria-label="Fechar menu">
            Fechar
          </button>
        </div>
        <div className="app-sidebar__brand-halo" />
        <div style={{
          padding: '14px 16px',
          borderRadius: 16,
          border: '1px solid var(--accent-border)',
          background: 'linear-gradient(135deg, var(--accent-soft), rgba(255,255,255,0.03))',
          color: 'var(--text-soft)',
          fontSize: 12,
          lineHeight: 1.6,
        }}>
          {BRAND.promise}
        </div>
        <div style={{
          marginTop: 12,
          fontSize: 10,
          color: 'var(--accent-copy)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
          {BRAND.tagline}
        </div>
      </div>

      <div className="app-sidebar__section">
        <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0 10px 10px' }}>
          {hasOperationalAccess ? 'Navegação principal' : 'Regularize seu acesso'}
        </div>
        <div className="app-sidebar__grid">
          {visibleItems.map((item) => {
            const active = activePage === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onNavigate(item.key)
                  onClose?.()
                }}
                className={`app-sidebar__nav-item ${active ? 'is-active' : ''}`}
              >
                <div className="app-sidebar__nav-main">
                  <div className="app-sidebar__nav-dot" />
                  <span>{item.label}</span>
                </div>
                <span className="app-sidebar__nav-badge">ativo</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="app-sidebar__footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg, var(--support), var(--bg-deep))',
            border: '1px solid var(--accent-soft-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: 'var(--accent)',
            fontWeight: 700,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
              Sessão
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
              {user?.access?.label || (user?.role === 'owner' ? 'Vitalício' : 'Sem assinatura')}
            </div>
            <button onClick={logout} style={{
              marginTop: 8,
              padding: 0,
              fontSize: 11,
              color: 'var(--accent-copy)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}>
              Encerrar sessão
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
