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
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      issuer: process.env.JWT_ISSUER || 'plumar-api',
      audience: process.env.JWT_AUDIENCE || 'plumar-web',
    })
    const fullUser = await userRepository.findById(payload.userId)
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
