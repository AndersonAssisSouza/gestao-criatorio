export function ComingSoon({ module }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🚧</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>{module}</div>
      <div style={{ fontSize: 13, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
        Módulo em desenvolvimento — próxima fase
      </div>
    </div>
  )
}
