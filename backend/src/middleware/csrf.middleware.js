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
  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer ') && authHeader.length > 10) {
    return next()
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
