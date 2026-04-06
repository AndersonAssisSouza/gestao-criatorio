const PAGE_TITLES = {
  plantel:    'Gestão do Plantel',
  chocando:   'Aves em Choco',
  gaiolas:    'Gestão das Gaiolas',
  filhotes:   'Filhotes Nascidos',
  especies:   'Espécies do Criatório',
  aviario:    'Gestão do Aviário',
  aneis:      'Controle de Anéis',
  financeiro: 'Gestão Financeira',
  explantel:  'Ex-Aves do Plantel',
  mutacoes:   'Simulação de Mutações',
}

export function Topbar({ page }) {
  const title = PAGE_TITLES[page] || page
  const hoje  = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div style={{
      height: 60, background: '#0D1A10',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 28px', flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif", letterSpacing: '-0.3px' }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
          {hoje}
        </div>
      </div>
      <span style={{
        fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#3A5C3C',
        background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.15)',
        borderRadius: 6, padding: '4px 10px',
      }}>
        MVP v0.1
      </span>
    </div>
  )
}
