function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",        // inline styles usados no SPA
      "script-src 'self'",
      "connect-src 'self' https://api.plumar.com.br https://api.mercadopago.com https://graph.microsoft.com https://login.microsoftonline.com",
      "frame-ancestors 'none'",                   // LOW-01: reforço contra clickjacking
      "object-src 'none'",                        // LOW-01: bloqueia plugins legados
      "base-uri 'self'",                          // LOW-01: evita override de <base>
      "form-action 'self'",                       // LOW-01: limita POSTs de forms
      "upgrade-insecure-requests",
    ].join('; ')
  )
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  next()
}

module.exports = securityHeaders
