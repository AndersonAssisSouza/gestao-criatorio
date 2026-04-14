const jwt = require('jsonwebtoken')
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
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
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
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.' })
    }
    return res.status(401).json({ message: 'Token inválido.' })
  }
}

module.exports = authMiddleware
