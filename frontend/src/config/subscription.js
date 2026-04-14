export const SUBSCRIPTION_PRICING = {
  monthly: 29.9,
  annual: 299,
  lifetime: 0,
}

export function formatSubscriptionPrice(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
