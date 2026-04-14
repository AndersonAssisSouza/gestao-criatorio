export function StatCard({ label, value, desc, color }) {
  const resolvedColor = color === '#C95025' || color === '#c95025' ? 'var(--accent)' : color

  return (
    <div className="stat-card">
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: resolvedColor, borderRadius: '16px 16px 0 0' }} />
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__desc">{desc}</div>
    </div>
  )
}
