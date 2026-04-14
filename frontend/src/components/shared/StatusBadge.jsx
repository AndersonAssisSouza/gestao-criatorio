import { STATUS_CONFIG } from '../../styles/tokens'

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#888', bg: 'rgba(100,100,100,0.08)', dot: '#888' }
  return (
    <span className="p-badge" style={{ background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}
