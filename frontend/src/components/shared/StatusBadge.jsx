import { STATUS_CONFIG } from '../../styles/tokens'

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#888', bg: 'rgba(100,100,100,0.1)', dot: '#888' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600,
      fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}
