/**
 * Rate limiting standalone — funciona em Express e Cloudflare Workers.
 *
 * Em Express: retorna middleware (req, res, next).
 * Em Workers: a camada de compatibilidade chama da mesma forma.
 *
 * Nota: em Workers, o estado in-memory é por isolate (não global).
 * Para rate-limiting global, usar Cloudflare Rate Limiting ou KV.
 * Esta implementação é best-effort e protege contra bursts.
 */

const stores = new Map()

function getStore(name) {
  if (!stores.has(name)) stores.set(name, new Map())
  return stores.get(name)
}

function cleanup(store, windowMs) {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.start > windowMs) store.delete(key)
  }
}

function createLimiter({ windowMs, max, message }) {
  const store = getStore(`${windowMs}-${max}`)

  // Cleanup periodically (only in long-lived processes like Express dev)
  if (typeof setInterval !== 'undefined') {
    try { setInterval(() => cleanup(store, windowMs), windowMs) } catch (_) {}
  }

  return function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.headers?.['cf-connecting-ip'] || req.headers?.['x-forwarded-for'] || 'unknown'
    const now = Date.now()
    const entry = store.get(ip)

    if (!entry || now - entry.start > windowMs) {
      store.set(ip, { count: 1, start: now })
      return next()
    }

    if (entry.count >= max) {
      const msg = typeof message === 'object' ? message : { message }
      return res.status(429).json(msg)
    }

    entry.count++
    return next()
  }
}

const loginLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Muitas tentativas de login. Aguarde 1 minuto.' },
})

const registerLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Muitas tentativas de cadastro. Aguarde alguns minutos.' },
})

const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Limite de requisições atingido.' },
})

module.exports = { apiLimiter, loginLimiter, registerLimiter }
