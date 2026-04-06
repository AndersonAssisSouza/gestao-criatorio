import { StatusBadge } from '../../shared/StatusBadge'

const TH = ({ children }) => (
  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#4A6A4C', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
)

const TD = ({ children, highlight }) => (
  <td style={{ padding: '12px 16px', fontSize: 13, color: highlight ? '#F2EDE4' : '#D8E8D8', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: "'DM Mono', monospace", verticalAlign: 'middle', fontWeight: highlight ? 500 : 400 }}>
    {children}
  </td>
)

export function AviarioTable({ data, onRowClick, onEdit, onDelete }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <TH>Nome</TH>
          <TH>Tipo</TH>
          <TH>Area (m2)</TH>
          <TH>Gaiolas</TH>
          <TH>Temp.</TH>
          <TH>Umidade</TH>
          <TH>Status</TH>
          <TH>Acoes</TH>
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr
            key={row.id}
            onClick={() => onRowClick(row)}
            style={{ cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,160,23,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <TD highlight>{row.nome}</TD>
            <TD>{row.tipo}</TD>
            <TD>{row.area} m2</TD>
            <TD>{row.gaiolasInstaladas}/{row.capacidadeGaiolas}</TD>
            <TD>{row.temperatura}°C</TD>
            <TD>{row.umidade}%</TD>
            <TD><StatusBadge status={row.status} /></TD>
            <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onEdit(row)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', color: '#8A9E8C', fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: 'pointer', marginRight: 4 }}
                onMouseEnter={e => { e.target.style.color = '#D4A017'; e.target.style.borderColor = 'rgba(212,160,23,0.3)' }}
                onMouseLeave={e => { e.target.style.color = '#8A9E8C'; e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >editar</button>
              <button
                onClick={() => onDelete(row)}
                style={{ background: 'rgba(224,92,75,0.08)', border: '1px solid rgba(224,92,75,0.15)', borderRadius: 6, padding: '5px 10px', color: '#E05C4B', fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: 'pointer' }}
              >remover</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
