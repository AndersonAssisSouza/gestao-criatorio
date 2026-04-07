import { StatusBadge } from '../../shared/StatusBadge'

const formatCurrency = (v) => {
  if (!v || v === 0) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

const CAMPOS = [
  ['Motivo da Saída',  'motivoSaida',   'badge'],
  ['Data de Saída',    'dataSaida'],
  ['Destinatário',     'destinatario'],
  ['Valor de Venda',   'valorVenda',    'currency'],
  ['Última Gaiola',    'ultimaGaiola'],
  ['Registro FOB',     'registroFOB'],
  ['Anel Esquerdo',    'anelEsquerdo'],
  ['Categoria',        'categoriaAve'],
  ['Gênero',           'genero'],
  ['Observações',      'observacoes',   'full'],
]

export function ExPlantelDetail({ ave, onClose, onEdit }) {
  return (
    <div style={{ background: 'rgba(21,40,24,0.9)', border: '1px solid rgba(201,80,37,0.15)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#F2EDE4', letterSpacing: '-0.4px', fontFamily: "'DM Serif Display', serif" }}>
            {ave.nome}
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={ave.motivoSaida} />
            <span style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
              {ave.categoriaAve} · {ave.genero}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onEdit} style={{ background: 'rgba(201,80,37,0.1)', border: '1px solid rgba(201,80,37,0.2)', borderRadius: 8, padding: '7px 14px', color: '#C95025', fontSize: 12, fontFamily: "'DM Mono', monospace", cursor: 'pointer' }}>
            editar
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', color: '#5A7A5C', fontSize: 12, fontFamily: "'DM Mono', monospace", cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Grid de campos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 20px' }}>
        {CAMPOS.map(([label, key, type]) => (
          <div key={key} style={type === 'full' ? { gridColumn: 'span 3' } : undefined}>
            <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#4A6A4C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 13, color: '#D8E8D8', fontFamily: "'DM Mono', monospace" }}>
              {type === 'badge'    ? <StatusBadge status={ave[key]} /> :
               type === 'currency' ? formatCurrency(ave[key]) :
               ave[key] || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
