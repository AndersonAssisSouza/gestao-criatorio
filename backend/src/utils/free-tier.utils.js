const { FREE_TIER_LIMITS } = require('../config/subscription.config')
const { buildAccessSummary } = require('./subscription.utils')

/**
 * Verifica se o usuário está em tier limitado e se excedeu o limite.
 *
 * @param {object} user - usuário (req.currentUser)
 * @param {'gaiolas'|'aves'|'ninhadas'} resource - tipo do recurso
 * @param {number} currentCount - contagem atual do recurso
 * @returns {{blocked: boolean, message?: string, limit?: number, access?: object}}
 */
function checkFreeTierLimit(user, resource, currentCount) {
  if (!user) return { blocked: false }

  const access = buildAccessSummary(user)

  // Apenas tier limitado tem restrições
  if (!access.limited) return { blocked: false, access }

  const limit = FREE_TIER_LIMITS[resource]
  if (typeof limit !== 'number') return { blocked: false, access }

  if (currentCount >= limit) {
    const resourceLabel = {
      gaiolas: 'gaiola',
      aves: 'ave',
      ninhadas: 'ninhada',
    }[resource] || resource

    return {
      blocked: true,
      limit,
      access,
      message: `Seu teste grátis expirou. No plano gratuito você pode cadastrar apenas ${limit} ${resourceLabel}${limit > 1 ? 's' : ''}. Assine o PLUMAR para liberar acesso completo.`,
    }
  }

  return { blocked: false, access }
}

module.exports = {
  checkFreeTierLimit,
}
