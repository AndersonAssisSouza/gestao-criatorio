const { jwtVerify } = require('jose')
const { getAuthCookieName, parseCookies } = require('../utils/security.utils')
const userRepository = require('../repositories/user.repository')

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  const cookies = parseCookies(req.headers.cookie)
  const headerToken = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null
  const cookieToken = cookies[getAuthCookieName()]
  const token = headerToken || cookieToken

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' })
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret || jwtSecret.length < 32) {
      console.error('[auth/middleware] JWT_SECRET não configurado ou muito curto (<32 chars)')
      return res.status(500).json({ message: 'Configuração de autenticação incompleta.' })
    }
    const secret = new TextEncoder().encode(jwtSecret)
    const { payload } = await jwtVerify(token, secret, {
      issuer: process.env.JWT_ISSUER || 'plumar-api',
      audience: process.env.JWT_AUDIENCE || 'plumar-web',
    })
    const fullUser = await userRepository.findById(payload.userId)

    // MED-04: se o user existe e tem tokenVersion diferente, rejeita sessão (revogada)
    if (fullUser) {
      const currentVersion = Number(fullUser.tokenVersion || 0)
      const tokenVersion = Number(payload.tokenVersion || 0)
      if (currentVersion !== tokenVersion) {
        return res.status(401).json({ message: 'Sessão revogada. Faça login novamente.' })
      }
    }

    req.user = fullUser
      ? {
          ...payload,
          userId: fullUser.id,
          email: fullUser.email,
          name: fullUser.name,
          role: fullUser.role || payload.role,
          accessKey: fullUser.accessKey,
        }
      : payload
    next()
  } catch (e) {
    if (e?.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.' })
    }
    return res.status(401).json({ message: 'Token inválido.' })
  }
}

module.exports = authMiddleware
