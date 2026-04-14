export function BrandMark({ size = 44, compact = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 0 : 12 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="plumarFrame" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-light)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
          <linearGradient id="plumarChest" x1="18" y1="22" x2="38" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-light)" />
            <stop offset="1" stopColor="var(--accent-strong)" />
          </linearGradient>
          <linearGradient id="plumarWing" x1="28" y1="22" x2="49" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--support-light)" />
            <stop offset="1" stopColor="var(--support)" />
          </linearGradient>
          <linearGradient id="plumarBody" x1="19" y1="18" x2="45" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1C2A21" />
            <stop offset="1" stopColor="#0D1712" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="rgba(255,255,255,0.04)" />
        <path
          d="M15 36C15 24.9543 23.9543 16 35 16C39.9213 16 44.427 17.7797 47.9095 20.7311"
          stroke="url(#plumarFrame)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M49 29C49 40.0457 40.0457 49 29 49C24.0787 49 19.573 47.2203 16.0905 44.2689"
          stroke="url(#plumarFrame)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M18 40.6C22.8 39.1 25.9 36 28.2 31.9C30.3 28.2 33.1 24.8 38.2 23.4C43.4 22 47.6 24.3 49.6 28.8C51.6 33.5 49.6 38.6 45.1 41.2C40.8 43.7 35.7 44.1 30.6 43.4C25.8 42.8 21.9 42.4 18 40.6Z"
          fill="url(#plumarBody)"
        />
        <path
          d="M18.3 40.4C21.3 39.8 24.7 40.4 27.8 42.1C24.6 43.7 20.7 43.6 17.2 42.5C15.9 42.1 15.8 40.9 18.3 40.4Z"
          fill="#0B140F"
        />
        <path
          d="M22.2 38.8C25.8 36.5 27.8 33.4 29.6 29.9C30.9 27.4 33.4 24.9 36.8 23.8C38.1 29.2 36.3 35.8 31.1 40.5C27.8 40.5 24.9 40 22.2 38.8Z"
          fill="url(#plumarChest)"
        />
        <path
          d="M31.5 28.4C35.4 25.1 40.3 24.9 44.3 27C46.8 28.3 47.9 31.6 46.4 34.2C44.2 38 39.4 39.2 34.4 38.5C32.6 35.3 31.7 31.9 31.5 28.4Z"
          fill="url(#plumarWing)"
          opacity="0.96"
        />
        <path d="M45.7 25.9L51 24.7L47.2 28.6Z" fill="#F9E4BE" />
        <circle cx="41.4" cy="27.7" r="1.85" fill="#FFF8F1" />
        <path
          d="M18 45.3C24 43.9 31 44 36.8 46.2"
          stroke="rgba(246,179,96,0.68)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
