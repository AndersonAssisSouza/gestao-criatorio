import { BRAND } from '../../brand'

import { useAuth } from '../../context/AuthContext'

export function Topbar({ page, title, description, onOpenMenu, onNavigate }) {
  const { user } = useAuth()
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const hasOperationalAccess = user?.access?.accessGranted || user?.role === 'owner'
  const isOwner = user?.role === 'owner'

  return (
    <header className="app-topbar">
      <div className="app-hero">
        <div className="app-hero__main">
          <div className="app-topbar__controls">
            <button type="button" className="app-menu-button" onClick={onOpenMenu}>
              Menu
            </button>
            <span className="pill">Experiência mobile ready</span>
          </div>
          <div className="app-hero__eyebrow">Sistema de manejo</div>
          <h1 className="app-hero__title">{title || page}</h1>
          <div className="app-hero__subtitle">{description}</div>
        </div>
        <div className="app-hero__spotlight">
          <div className="app-hero__spotlight-kicker">Workspace atual</div>
          <div className="app-hero__spotlight-title">{BRAND.shortName} control center</div>
          <div className="app-hero__spotlight-text">
            Navegação mais rápida, leitura limpa e acesso adaptado para uso em campo no celular.
          </div>
          <div className="app-hero__actions">
            <button type="button" className="app-hero__action app-hero__action--primary" onClick={() => onNavigate?.('configuracoes')}>
              Ajustar visual
            </button>
            {isOwner && (
              <button type="button" className="app-hero__action" onClick={() => onNavigate?.('proprietario')}>
                Área master
              </button>
            )}
            <button type="button" className="app-hero__action" onClick={() => onNavigate?.(hasOperationalAccess ? 'plantel' : 'assinatura')}>
              {hasOperationalAccess ? 'Ir para plantel' : 'Ver assinatura'}
            </button>
          </div>
        </div>
      </div>
      <div className="app-topbar__aside">
        {isOwner && <span className="pill pill--accent">Conta master</span>}
        <span className="pill">{BRAND.shortName} OS</span>
        <span className="pill">{BRAND.descriptor}</span>
        <span className="pill">{hoje}</span>
        <span className="pill pill--accent">{BRAND.badge}</span>
      </div>
    </header>
  )
}
