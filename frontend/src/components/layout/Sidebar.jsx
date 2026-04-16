import { useAuth } from '../../context/AuthContext'
import { BRAND } from '../../brand'
import { BrandMark } from '../shared/BrandMark'
import { SocialFooter } from '../shared/SocialFooter'

const NAV_GROUPS = [
  {
    label: 'Manejo',
    items: [
      { key: 'plantel', label: 'Plantel' },
      { key: 'chocando', label: 'Aves em Choco' },
      { key: 'gaiolas', label: 'Gaiolas' },
      { key: 'filhotes', label: 'Filhotes' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { key: 'especies', label: 'Espécies' },
      { key: 'aviario', label: 'Criatórios' },
      { key: 'aneis', label: 'Anéis' },
    ],
  },
  {
    label: 'Análise',
    items: [
      { key: 'financeiro', label: 'Financeiro' },
      { key: 'explantel', label: 'Ex-Plantel' },
      { key: 'mutacoes', label: 'Mutações', ownerOnly: true },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { key: 'assinatura', label: 'Assinatura' },
      { key: 'proprietario', label: 'Proprietário', ownerOnly: true },
      { key: 'ajuda', label: 'Ajuda' },
      { key: 'configuracoes', label: 'Configurações' },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

export function Sidebar({ activePage, onNavigate, isOpen = true, onClose }) {
  const { user, logout } = useAuth()
  const userName = user?.name || user?.email?.split('@')[0] || 'Usuário'
  const initials = userName.slice(0, 2).toUpperCase()
  const hasAccess = user?.access?.accessGranted || user?.role === 'owner'
  const isOwner = user?.role === 'owner'

  const isVisible = (item) => {
    if (item.ownerOnly) return isOwner
    if (['assinatura', 'ajuda', 'configuracoes'].includes(item.key)) return true
    return hasAccess
  }

  return (
    <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="app-sidebar__brand">
        <div className="app-sidebar__brand-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={36} compact />
            <div>
              <div style={{ fontSize: 18, fontFamily: "'DM Serif Display', serif", color: '#f0e8dc', lineHeight: 1 }}>
                {BRAND.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
                {BRAND.descriptor}
              </div>
            </div>
          </div>
          <button type="button" className="app-sidebar__close" onClick={onClose} aria-label="Fechar menu">
            ✕
          </button>
        </div>
      </div>

      <div className="app-sidebar__section">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isVisible)
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label}>
              <div className="app-sidebar__nav-group-label">{group.label}</div>
              <div className="app-sidebar__grid">
                {visibleItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => { onNavigate(item.key); onClose?.() }}
                    className={`app-sidebar__nav-item ${activePage === item.key ? 'is-active' : ''}`}
                  >
                    <div className="app-sidebar__nav-main">
                      <div className="app-sidebar__nav-dot" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <SocialFooter variant="dark" />

      <div className="app-sidebar__footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(201,122,80,0.3), rgba(90,146,127,0.3))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#f0c8a8', fontWeight: 700,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
              {user?.access?.label || (isOwner ? 'Vitalício' : 'Sem assinatura')}
            </div>
          </div>
          <button onClick={logout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '4px 8px',
            borderRadius: 6, transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.target.style.color = '#f0c8a8'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.3)'; e.target.style.background = 'none' }}
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
