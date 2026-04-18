const { getCsrfCookieName, parseCookies } = require('../utils/security.utils')

/**
 * CSRF Protection Middleware
 *
 * Cross-domain setup (GitHub Pages → Vercel):
 *   Cookies com SameSite=Lax não são enviados cross-origin em POSTs,
 *   então o CSRF via cookie não funciona. Como a autenticação já é feita
 *   via JWT Bearer token armazenado no localStorage (que por definição
 *   não é enviado automaticamente pelo browser), requisições com Bearer
 *   token válido já possuem proteção equivalente contra CSRF.
 *
 * Estratégia:
 *   1. Se há um Bearer token no header Authorization → CSRF implícito (OK)
 *   2. Senão, valida cookie CSRF + header X-CSRF-Token (fluxo original)
 */
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // Bearer tokens no localStorage são imunes a CSRF por natureza:
  // o browser nunca os envia automaticamente em requisições cross-origin.
  // HIGH-02: validação mais estrita do formato para evitar bypass trivial.
  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    // JWT válido tem 3 segmentos base64url separados por '.'
    if (token.length >= 40 && token.split('.').length === 3) {
      return next()
    }
    // Token presente mas inválido → rejeita explicitamente
    return res.status(403).json({ message: 'Token Bearer malformado.' })
  }

  // Fallback: validação CSRF tradicional via cookie (para same-origin)
  const cookies = parseCookies(req.headers.cookie)
  const cookieToken = cookies[getCsrfCookieName()]
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Falha de verificação CSRF.' })
  }

  return next()
}

module.exports = csrfProtection
