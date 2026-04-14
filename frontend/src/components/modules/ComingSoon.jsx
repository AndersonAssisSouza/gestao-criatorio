export function ComingSoon({ module }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon__grid">
        <div className="coming-soon__card">
          <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
            Próxima frente
          </div>
          <h2 className="coming-soon__title">{module}</h2>
          <div className="coming-soon__text">
            Esta área já está reservada na arquitetura do sistema e será a próxima a receber o mesmo refinamento visual e operacional das telas principais.
          </div>
        </div>

        <div className="coming-soon__card">
          <div style={{ fontSize: 44, marginBottom: 12 }}>⌛</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
            Status
          </div>
          <div style={{ color: 'var(--text-main)', fontSize: 18, fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>
            Em desenvolvimento
          </div>
          <div className="coming-soon__text">
            Estrutura pronta para receber dados, interações e regras de negócio nas próximas etapas.
          </div>
        </div>
      </div>
    </div>
  )
}
