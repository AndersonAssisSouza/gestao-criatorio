import { useAuth } from '../../context/AuthContext'

export function Topbar({ page, title, description, onOpenMenu }) {
  const { user } = useAuth()
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="app-topbar">
      <div className="app-hero">
        <div className="app-hero__main">
          <div className="app-topbar__controls">
            <button type="button" className="app-menu-button" onClick={onOpenMenu}>
              ☰ Menu
            </button>
          </div>
          <div className="app-hero__eyebrow">{page}</div>
          <h1 className="app-hero__title">{title}</h1>
          <div className="app-hero__subtitle">{description}</div>
        </div>
      </div>
      <div className="app-topbar__aside">
        <span className="pill">{hoje}</span>
        {user?.role === 'owner' && <span className="pill pill--accent">Master</span>}
      </div>
    </header>
  )
}
