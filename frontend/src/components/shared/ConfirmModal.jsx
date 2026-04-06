export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }) {
  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        background: '#0F2212', borderRadius: 12, width: 380, padding: '28px 32px',
        border: `1px solid ${danger ? 'rgba(224,92,75,0.25)' : 'rgba(212,160,23,0.2)'}`,
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#F2EDE4', marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#7A9E7C', fontFamily: "'DM Mono', monospace", marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '10px 20px', color: '#8A9E8C',
            fontSize: 13, fontFamily: "'DM Mono', monospace", cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            background: danger ? 'rgba(224,92,75,0.15)' : 'linear-gradient(135deg, #D4A017, #B8870F)',
            border: danger ? '1px solid rgba(224,92,75,0.4)' : 'none',
            borderRadius: 8, padding: '10px 20px',
            color: danger ? '#E05C4B' : '#0A1A0C',
            fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
