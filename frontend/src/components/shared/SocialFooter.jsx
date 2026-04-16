export function SocialFooter({ variant = 'dark' }) {
  const isDark = variant === 'dark'
  const baseColor = isDark ? 'rgba(255,255,255,0.7)' : 'var(--text-muted, #6b7280)'
  const hoverColor = isDark ? '#fff' : 'var(--text-primary, #111)'
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  const linkStyle = {
    color: baseColor,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    transition: 'color 0.15s ease',
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        padding: '14px 16px',
        borderTop: `1px solid ${borderColor}`,
        flexWrap: 'wrap',
      }}
    >
      <a
        href="https://instagram.com/plumar.app"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onMouseOver={(e) => (e.currentTarget.style.color = hoverColor)}
        onMouseOut={(e) => (e.currentTarget.style.color = baseColor)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
        Plumar
      </a>

      <a
        href="https://www.facebook.com/profile.php?id=61573269494061"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onMouseOver={(e) => (e.currentTarget.style.color = hoverColor)}
        onMouseOut={(e) => (e.currentTarget.style.color = baseColor)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
        Plumar
      </a>
    </div>
  )
}
