export function StatCard({ label, value, desc, color }) {
  return (
    <div style={{
      background: 'rgba(21,40,24,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: color, opacity: 0.7 }} />
      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#5A7A5C', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#F2EDE4', letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
        {desc}
      </div>
    </div>
  )
}
