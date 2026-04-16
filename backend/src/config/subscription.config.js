const SUBSCRIPTION_PRICING = {
  monthly: 29.9,
  annual: 299,
  lifetime: 0,
}

// Duração do trial grátis ao cadastrar (dias)
const TRIAL_DAYS = 30

// Limites do tier gratuito após expiração do trial (sem assinatura)
const FREE_TIER_LIMITS = {
  gaiolas: 1,
  aves: 2,
  ninhadas: 1,
}

module.exports = {
  SUBSCRIPTION_PRICING,
  TRIAL_DAYS,
  FREE_TIER_LIMITS,
}
