import { StatusBadge } from '../../shared/StatusBadge'

const TH = ({ children }) => (
  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontFamily: 'inherit', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
)

const TD = ({ children, highlight }) => (
  <td style={{ padding: '12px 16px', fontSize: 13, color: highlight ? '#F2EDE4' : '#D8E8D8', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'inherit', verticalAlign: 'middle', fontWeight: highlight ? 500 : 400 }}>
    {children}
  </td>
)

export function ChocandoTable({ data, onRowClick, onEdit, onDelete }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <TH>Ave</TH>
          <TH>Categoria</TH>
          <TH>Gaiola</TH>
          <TH>Início</TH>
          <TH>Previsão Eclosão</TH>
          <TH>Qtd Ovos</TH>
          <TH>Férteis</TH>
          <TH>Status</TH>
          <TH>Ações</TH>
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr
            key={row.id}
            onClick={() => onRowClick(row)}
            style={{ cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,80,37,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <TD highlight>{row.aveNome}</TD>
            <TD>{row.categoriaAve}</TD>
            <TD>{row.gaiola || '—'}</TD>
            <TD>{row.dataInicio || '—'}</TD>
            <TD>{row.previsaoEclosao || '—'}</TD>
            <TD>{row.quantidadeOvos ?? '—'}</TD>
            <TD>{row.ovosFerteis ?? '—'}</TD>
            <TD><StatusBadge status={row.status} /></TD>
            <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onEdit(row)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-soft)', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', marginRight: 4 }}
                onMouseEnter={e => { e.target.style.color = '#C95025'; e.target.style.borderColor = 'rgba(201,80,37,0.3)' }}
                onMouseLeave={e => { e.target.style.color = '#8A9E8C'; e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >editar</button>
              <button
                onClick={() => onDelete(row)}
                style={{ background: 'rgba(224,92,75,0.08)', border: '1px solid rgba(224,92,75,0.15)', borderRadius: 6, padding: '5px 10px', color: '#E05C4B', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}
              >remover</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
