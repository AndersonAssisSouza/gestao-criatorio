/**
 * Logger estruturado leve — sem dependência externa.
 * Emite JSON em produção e texto legível em dev.
 * Aplica redação automática de campos sensíveis.
 */

const SENSITIVE_KEYS = new Set([
  'password', 'passwordhash', 'passwordresethashtoken', 'passwordresettoken',
  'authorization', 'cookie', 'set-cookie', 'x-csrf-token', 'x-api-key',
  'access_token', 'accesstoken', 'refresh_token', 'refreshtoken',
  'jwt_secret', 'jwtsecret', 'webhook_secret', 'webhooksecret',
  'mercadopago_access_token', 'mercadopagoaccesstoken',
  'cardnumber', 'card_number', 'cvc', 'cvv', 'secret',
])

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function redactValue(value) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    // Redação parcial de emails (mantém domínio para diagnóstico)
    if (EMAIL_REGEX.test(value)) {
      const [local, domain] = value.split('@')
      if (local.length <= 2) return `***@${domain}`
      return `${local.slice(0, 2)}***@${domain}`
    }
    // Redação de strings longas tipo tokens
    if (value.length > 40 && /^[A-Za-z0-9+/=._-]{40,}$/.test(value)) {
      return `${value.slice(0, 6)}...[${value.length}ch]`
    }
    return value
  }
  if (typeof value !== 'object') return value
  return redactObject(value)
}

function redactObject(obj) {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(redactValue)
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      // Só primeiras 3 linhas do stack em prod
      stack: String(obj.stack || '').split('\n').slice(0, 4).join(' | '),
    }
  }
  if (typeof obj !== 'object') return obj

  const out = {}
  for (const k of Object.keys(obj)) {
    const lk = k.toLowerCase()
    if (SENSITIVE_KEYS.has(lk)) {
      out[k] = '[REDACTED]'
    } else {
      out[k] = redactValue(obj[k])
    }
  }
  return out
}

function isProd() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
}

function format(level, msg, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: typeof msg === 'string' ? msg : JSON.stringify(msg),
    ...(meta ? { meta: redactObject(meta) } : {}),
  }
  if (isProd()) return JSON.stringify(entry)
  // Dev: formato legível
  const metaStr = entry.meta ? ` ${JSON.stringify(entry.meta)}` : ''
  return `${entry.ts} [${level.toUpperCase()}] ${entry.msg}${metaStr}`
}

function createLogger(namespace = 'app') {
  return {
    info(msg, meta) {
      console.log(format('info', `[${namespace}] ${msg}`, meta))
    },
    warn(msg, meta) {
      console.warn(format('warn', `[${namespace}] ${msg}`, meta))
    },
    error(msg, meta) {
      console.error(format('error', `[${namespace}] ${msg}`, meta))
    },
    debug(msg, meta) {
      if (!isProd()) {
        console.log(format('debug', `[${namespace}] ${msg}`, meta))
      }
    },
  }
}

module.exports = {
  createLogger,
  redactObject,
  redactValue,
}
