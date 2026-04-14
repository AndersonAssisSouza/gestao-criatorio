import { useAuth } from '../../context/AuthContext'
import { NAV_ITEMS } from './Sidebar'

const DOCK_ITEMS = ['plantel', 'chocando', 'financeiro', 'assinatura', 'configuracoes', 'proprietario']

export function MobileDock({ activePage, onNavigate, onOpenMenu }) {
  const { user } = useAuth()
  const hasOperationalAccess = user?.access?.accessGranted || user?.role === 'owner'

  const items = NAV_ITEMS.filter((item) => {
    if (!DOCK_ITEMS.includes(item.key)) return false
    if (item.key === 'proprietario') return user?.role === 'owner'
    if (item.key === 'assinatura' || item.key === 'configuracoes') return true
    return hasOperationalAccess
  })

  return (
    <nav className="app-mobile-dock" aria-label="Atalhos do sistema">
      {items.map((item) => {
        const active = activePage === item.key

        return (
          <button
            key={item.key}
            type="button"
            className={`app-mobile-dock__item ${active ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="app-mobile-dock__dot" />
            <span className="app-mobile-dock__label">{item.label}</span>
          </button>
        )
      })}

      <button type="button" className="app-mobile-dock__item" onClick={onOpenMenu}>
        <span className="app-mobile-dock__dot app-mobile-dock__dot--menu" />
        <span className="app-mobile-dock__label">Menu</span>
      </button>
    </nav>
  )
}
