const userRepository = require('../repositories/user.repository')
const { buildAccessSummary } = require('../utils/subscription.utils')

async function loadCurrentUser(req, res) {
  const user = await userRepository.findById(req.user.userId)

  if (!user) {
    res.status(401).json({ message: 'Usuário não encontrado.' })
    return null
  }

  req.currentUser = user
  req.accessSummary = buildAccessSummary(user)
  return user
}

async function attachCurrentUser(req, res, next) {
  const user = await loadCurrentUser(req, res)
  if (!user) return undefined
  return next()
}

async function requireAccess(req, res, next) {
  try {
    const user = await loadCurrentUser(req, res)
    if (!user) return undefined

    if (!req.accessSummary.accessGranted) {
      return res.status(402).json({
        message: 'Seu acesso está bloqueado. Regularize sua assinatura para continuar.',
        access: req.accessSummary,
      })
    }

    return next()
  } catch (error) {
    console.error('[access/requireAccess]', error)
    return res.status(500).json({ message: 'Erro ao validar assinatura.' })
  }
}

async function requireOwner(req, res, next) {
  try {
    const user = await loadCurrentUser(req, res)
    if (!user) return undefined

    if (req.currentUser.role !== 'owner') {
      return res.status(403).json({ message: 'Área restrita ao proprietário do sistema.' })
    }

    return next()
  } catch (error) {
    console.error('[access/requireOwner]', error)
    return res.status(500).json({ message: 'Erro ao validar permissões.' })
  }
}

module.exports = {
  attachCurrentUser,
  requireAccess,
  requireOwner,
}
