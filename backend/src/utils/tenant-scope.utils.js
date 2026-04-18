const { getCriatorioForUser } = require('../services/criatorio.service')

/**
 * Resolve o criatório do usuário autenticado. Retorna null se não houver.
 */
async function resolveUserCriatorio(req) {
  if (!req?.user) return null
  try {
    return await getCriatorioForUser(req.user)
  } catch (_) {
    return null
  }
}

/**
 * Marca um item com o escopo do criatório do usuário.
 */
function stampCriatorio(item, criatorio, user) {
  if (!item || !criatorio) return item
  return {
    ...item,
    criatorioId: criatorio.id,
    userId: user?.userId || user?.id || item.userId || null,
  }
}

/**
 * Verifica se um item pertence ao criatório informado.
 * Regra de compatibilidade com registros legados (pré-migração):
 *   - Se o item NÃO possui criatorioId nem userId → considera "órfão" e
 *     permite apenas ao owner (isso evita quebrar dados antigos).
 */
function itemBelongsTo(item, criatorio, user) {
  if (!item) return false
  if (item.criatorioId && String(item.criatorioId) === String(criatorio?.id)) return true
  if (item.userId && (String(item.userId) === String(user?.userId || user?.id))) return true
  // Registros legados sem escopo → só owner vê/mexe
  if (!item.criatorioId && !item.userId) {
    return user?.role === 'owner'
  }
  return false
}

/**
 * Filtra uma lista aplicando o escopo do criatório / usuário.
 * Owner vê tudo (para administração/moderação).
 */
function filterByScope(items = [], criatorio, user) {
  if (!Array.isArray(items)) return []
  if (user?.role === 'owner') return items
  return items.filter((item) => itemBelongsTo(item, criatorio, user))
}

/**
 * Middleware helper — chame dentro do controller para garantir criatório.
 * Retorna { criatorio } se OK ou envia resposta de erro e retorna null.
 */
async function requireCriatorio(req, res) {
  const criatorio = await resolveUserCriatorio(req)
  if (!criatorio && req.user?.role !== 'owner') {
    res.status(403).json({ message: 'Cadastre seu criatório antes de acessar este recurso.' })
    return null
  }
  return { criatorio }
}

module.exports = {
  resolveUserCriatorio,
  stampCriatorio,
  itemBelongsTo,
  filterByScope,
  requireCriatorio,
}
