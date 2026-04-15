import { StatusBadge } from '../../shared/StatusBadge'

const CAMPOS = [
  ['Tipo',              'tipo'],
  ['Diametro',          'diametro'],
  ['Cor',               'cor'],
  ['Ave Associada',     'aveAssociada'],
  ['Data de Colocacao', 'dataColocacao'],
  ['Lote',              'lote'],
  ['Observacoes',       'observacoes'],
]

export function AneisDetail({ anel, onClose, onEdit }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.15)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.4px', fontFamily: "'DM Serif Display', serif" }}>
            {anel.codigo}
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={anel.status} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
              {anel.tipo} · {anel.cor}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onEdit} style={{ background: 'rgba(201,80,37,0.1)', border: '1px solid rgba(201,80,37,0.2)', borderRadius: 8, padding: '7px 14px', color: '#C95025', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
            editar
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Grid de campos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px 20px' }}>
        {CAMPOS.map(([label, key]) => (
          <div key={key}>
            <div style={{ fontSize: 10, fontFamily: 'inherit', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 13, color: '#D8E8D8', fontFamily: 'inherit' }}>
              {key === 'diametro' && anel[key] ? `${anel[key]} mm` : (anel[key] || '\u2014')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
