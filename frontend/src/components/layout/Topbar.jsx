import { useAuth } from '../../context/AuthContext'

export function Topbar({ onOpenMenu }) {
  const { user } = useAuth()
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        <button type="button" className="app-menu-button" onClick={onOpenMenu}>
          ☰ Menu
        </button>
      </div>
      <div className="app-topbar__aside">
        <span className="pill">{hoje}</span>
        {user?.role === 'owner' && <span className="pill pill--accent">Master</span>}
      </div>
    </header>
  )
}
