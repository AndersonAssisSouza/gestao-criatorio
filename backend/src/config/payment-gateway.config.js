function normalizeUrl(value = '') {
  return String(value || '').trim().replace(/\/+$/, '')
}

function isHttpsUrl(value = '') {
  return /^https:\/\//i.test(String(value || '').trim())
}

function getPaymentGatewayConfig() {
  const provider = String(process.env.PAYMENT_PROVIDER || 'mercadopago').trim().toLowerCase()
  const frontendPublicUrl = normalizeUrl(process.env.FRONTEND_PUBLIC_URL || process.env.FRONTEND_URL || '')
  const backendPublicUrl = normalizeUrl(process.env.BACKEND_PUBLIC_URL || '')

  return {
    provider,
    frontendPublicUrl,
    backendPublicUrl,
    mercadoPago: {
      accessToken: String(process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim(),
      webhookSecret: String(process.env.MERCADOPAGO_WEBHOOK_SECRET || '').trim(),
      statementDescriptor: String(process.env.MERCADOPAGO_STATEMENT_DESCRIPTOR || 'PLUMAR').trim().slice(0, 13),
    },
  }
}

function getCheckoutAvailability() {
  const config = getPaymentGatewayConfig()
  const isMercadoPago = config.provider === 'mercadopago'
  const hasHttpsFront = isHttpsUrl(config.frontendPublicUrl)
  const hasHttpsBack = isHttpsUrl(config.backendPublicUrl)
  const configured = Boolean(
    isMercadoPago &&
    config.mercadoPago.accessToken &&
    hasHttpsFront &&
    hasHttpsBack
  )

  return {
    configured,
    provider: config.provider,
    frontendPublicUrl: config.frontendPublicUrl,
    backendPublicUrl: config.backendPublicUrl,
    reasons: [
      !isMercadoPago ? 'provider_invalido' : null,
      !config.mercadoPago.accessToken ? 'mercadopago_token_ausente' : null,
      !hasHttpsFront ? 'frontend_public_url_https_obrigatoria' : null,
      !hasHttpsBack ? 'backend_public_url_https_obrigatoria' : null,
    ].filter(Boolean),
  }
}

module.exports = {
  getCheckoutAvailability,
  getPaymentGatewayConfig,
}
