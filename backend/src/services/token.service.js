const axios = require('axios')

let cachedToken    = null
let tokenExpiresAt = null

/**
 * Obtém token de acesso ao Microsoft Graph API via Client Credentials.
 * Faz cache do token e renova automaticamente quando expira.
 */
async function getGraphToken() {
  const now = Date.now()

  // Retorna token em cache se ainda válido (com 5 min de margem)
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 300_000) {
    return cachedToken
  }

  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error('Variáveis de ambiente Azure não configuradas. Ver .env.example')
  }

  const url  = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    scope:         'https://graph.microsoft.com/.default',
  })

  const { data } = await axios.post(url, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  cachedToken    = data.access_token
  tokenExpiresAt = now + data.expires_in * 1000

  return cachedToken
}

module.exports = { getGraphToken }
