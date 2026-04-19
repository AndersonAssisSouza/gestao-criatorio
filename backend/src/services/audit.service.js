// Audit log de eventos sensíveis de segurança.
// Implementação minimalista: escreve via logger estruturado (redação automática).
// TODO: migrar para tabela dedicada no Neon quando houver volume.

const { redactObject } = require('../utils/logger.utils')

function timestamp() {
  return new Date().toISOString()
}

function clientIp(req) {
  return (
    req?.headers?.['cf-connecting-ip'] ||
    req?.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim() ||
    req?.ip ||
    null
  )
}

function log(event, req, payload = {}) {
  const entry = {
    ts: timestamp(),
    audit: true,
    event,
    ip: clientIp(req),
    userAgent: req?.headers?.['user-agent']?.slice(0, 160) || null,
    userId: req?.user?.userId || payload.userId || null,
    email: payload.email || null,
    ...payload,
  }
  // eslint-disable-next-line no-console
  console.log('[AUDIT]', JSON.stringify(redactObject(entry)))
}

module.exports = { log }
