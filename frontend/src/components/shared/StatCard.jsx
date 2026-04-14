export function StatCard({ label, value, desc, color }) {
  const accentAliases = ['#C95025', '#c95025']
  const resolvedColor = accentAliases.includes(color) ? 'var(--accent)' : color
  const glow = accentAliases.includes(color)
    ? 'radial-gradient(circle, rgba(var(--accent-rgb), 0.18) 0%, transparent 70%)'
    : `radial-gradient(circle, ${color}2D 0%, transparent 70%)`

  return (
    <div className="stat-card">
      <div style={{
        position: 'absolute',
        inset: 'auto -20px -40px auto',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: glow,
      }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: resolvedColor, opacity: 0.75 }} />
      <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.08em', lineHeight: 1, marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  )
}
