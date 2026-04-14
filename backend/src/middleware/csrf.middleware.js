const { getCsrfCookieName, parseCookies } = require('../utils/security.utils')

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const cookies = parseCookies(req.headers.cookie)
  const cookieToken = cookies[getCsrfCookieName()]
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Falha de verificação CSRF.' })
  }

  return next()
}

module.exports = csrfProtection
