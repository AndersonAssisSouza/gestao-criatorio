export function LimitedTierBanner({ access, onGoToSubscription }) {
  if (!access?.limited) return null

  const limits = access.limits || { gaiolas: 1, aves: 2, ninhadas: 1 }

  return (
    <div
      style={{
        margin: '12px 16px',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
        border: '1px solid #FB8C00',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        color: '#6D4C41',
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <strong style={{ fontSize: 14, color: '#E65100' }}>
          ⚠️ Seu período de teste expirou
        </strong>
        <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.4 }}>
          Você está no plano gratuito com limite de <strong>{limits.gaiolas} gaiola</strong>,{' '}
          <strong>{limits.aves} aves</strong> e <strong>{limits.ninhadas} ninhada</strong>.
          Assine para liberar acesso completo.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToSubscription}
        style={{
          background: '#E65100',
          color: '#fff',
          border: 'none',
          padding: '10px 18px',
          borderRadius: 8,
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 13,
          whiteSpace: 'nowrap',
        }}
      >
        Assinar agora
      </button>
    </div>
  )
}
