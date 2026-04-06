import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { key: 'plantel',    label: 'Plantel',          path: '/plantel',    available: true },
  { key: 'chocando',   label: 'Aves em Choco',    path: '/chocando',   available: true },
  { key: 'gaiolas',    label: 'Gaiolas',           path: '/gaiolas',    available: true },
  { key: 'filhotes',   label: 'Filhotes',          path: '/filhotes',   available: true },
  { key: 'especies',   label: 'Espécies',          path: '/especies',   available: true },
  { key: 'aviario',    label: 'Aviário',           path: '/aviario',    available: true },
  { key: 'aneis',      label: 'Anéis',             path: '/aneis',      available: true },
  { key: 'financeiro', label: 'Financeiro',        path: '/financeiro', available: true },
  { key: 'explantel',  label: 'Ex-Plantel',        path: '/explantel',  available: true },
  { key: 'mutacoes',   label: 'Mutações',          path: '/mutacoes',   available: true },
]

function BirdIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <path d="M3 12C3 12 8 6 12 8C16 10 17 7 21 6C21 6 18 12 15 12C12 12 11 14 9 15C7 16 5 15 3 12Z" fill="#0A1A0C" opacity="0.9"/>
      <path d="M9 15C9 15 8 18 6 19C7 19 10 18 11 16" fill="#0A1A0C" opacity="0.6"/>
    </svg>
  )
}

export function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth()
  const userName = user?.name || user?.email?.split('@')[0] || 'Usuário'

  return (
    <div style={{
      width: 240, background: '#0D1A10',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', padding: '24px 0',
      flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #D4A017, #B8870F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(212,160,23,0.35)',
          }}>
            <BirdIcon />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Criatório</div>
            <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gestão Avícola</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '0 12px', flex: 1 }}>
        <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#3A5C3C', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 8px 6px', marginTop: 8 }}>
          Módulos
        </div>
        {NAV_ITEMS.map(item => {
          const active = activePage === item.key
          if (!item.available) {
            return (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 8, color: '#2A4A2C', fontSize: 13,
                fontFamily: "'DM Mono', monospace", marginBottom: 2, opacity: 0.5,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A3A1C', flexShrink: 0 }} />
                {item.label}
              </div>
            )
          }
          return (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
                color: active ? '#D4A017' : '#8A9E8C',
                fontSize: 13, fontFamily: "'DM Mono', monospace",
                border: active ? '1px solid rgba(212,160,23,0.2)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#D4A017' : '#2A4A2C', flexShrink: 0 }} />
              {item.label}
            </div>
          )
        })}
      </div>

      {/* User footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2A5C2E, #1A3A1C)',
            border: '1px solid rgba(212,160,23,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#D4A017', fontWeight: 700,
          }}>
            {userName[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8A9E8C', fontFamily: "'DM Mono', monospace", lineHeight: 1.3 }}>{userName}</div>
            <button onClick={logout} style={{
              fontSize: 11, color: '#4A6A4C', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: "'DM Mono', monospace", padding: 0,
              textDecoration: 'underline', marginTop: 2,
            }}>sair</button>
          </div>
        </div>
      </div>
    </div>
  )
}
