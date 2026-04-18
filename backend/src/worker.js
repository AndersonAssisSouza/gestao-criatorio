import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ---------------------------------------------------------------------------
// Existing modules (CommonJS — esbuild handles interop)
// ---------------------------------------------------------------------------
const authController = require('./controllers/auth.controller')
const accessController = require('./controllers/access.controller')
const paymentController = require('./controllers/payment.controller')
const plantelController = require('./controllers/plantel.controller')
const filhotesController = require('./controllers/filhotes.controller')
const ovosController = require('./controllers/ovos.controller')
const gaiolasController = require('./controllers/gaiolas.controller')
const criatorioController = require('./controllers/criatorio.controller')
const aneisController = require('./controllers/aneis.controller')
const sharepointImportController = require('./controllers/sharepoint-import.controller')
const speciesController = require('./controllers/species.controller')
const mutacoesController = require('./controllers/mutacoes.controller')
const cuponsController = require('./controllers/cupons.controller')

const authMiddleware = require('./middleware/auth.middleware')
const csrfProtection = require('./middleware/csrf.middleware')
const { attachCurrentUser, requireAccess, requireOwner } = require('./middleware/access.middleware')
const { apiLimiter, loginLimiter, registerLimiter } = require('./middleware/rateLimit')

const { sendEmail } = require('./services/email.service')
const { getPaymentGatewayConfig } = require('./config/payment-gateway.config')
const axios = require('axios')

// ---------------------------------------------------------------------------
// Express-to-Hono compatibility layer
// ---------------------------------------------------------------------------

/**
 * Wraps an Express-style handler `(req, res) => ...` so it can be used as a
 * Hono handler `(c) => Response`.
 */
function wrapHandler(fn) {
  return async (c) => {
    // --- mock req ---
    let parsedBody = {}
    try {
      const ct = c.req.header('content-type') || ''
      if (ct.includes('application/json')) {
        parsedBody = await c.req.json()
      }
    } catch (_) {
      // body may be empty or non-JSON — that's fine
    }

    const url = new URL(c.req.url)

    const headersObj = {}
    c.req.raw.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value
    })

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      '127.0.0.1'

    const req = {
      body: parsedBody,
      params: c.req.param(),
      query: Object.fromEntries(url.searchParams.entries()),
      headers: headersObj,
      get(name) {
        return c.req.header(name)
      },
      ip,
      user: c.get('user'),
      currentUser: c.get('currentUser'),
      accessSummary: c.get('accessSummary'),
      connection: { remoteAddress: ip },
    }

    // --- mock res ---
    let _status = 200
    let _body = null
    const _headers = new Headers()

    const res = {
      status(code) {
        _status = code
        return res
      },
      json(data) {
        _body = data
        _headers.set('Content-Type', 'application/json')
        return res
      },
      send(data) {
        _body = data
        return res
      },
      setHeader(name, value) {
        if (Array.isArray(value)) {
          value.forEach((v) => _headers.append(name, v))
        } else {
          _headers.set(name, value)
        }
        return res
      },
      _toResponse() {
        const body =
          _body === null || _body === undefined
            ? null
            : typeof _body === 'string'
              ? _body
              : JSON.stringify(_body)
        return new Response(body, { status: _status, headers: _headers })
      },
    }

    await fn(req, res)
    return res._toResponse()
  }
}

/**
 * Wraps an Express-style middleware `(req, res, next) => ...` so it can be
 * used as Hono middleware.
 */
function wrapMiddleware(fn) {
  return async (c, next) => {
    let parsedBody = {}
    try {
      const ct = c.req.header('content-type') || ''
      if (ct.includes('application/json')) {
        // Clone request so body can be re-read by downstream handlers
        parsedBody = await c.req.raw.clone().json()
      }
    } catch (_) {
      // ignore
    }

    const url = new URL(c.req.url)

    const headersObj = {}
    c.req.raw.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value
    })

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      '127.0.0.1'

    const req = {
      body: parsedBody,
      params: c.req.param(),
      query: Object.fromEntries(url.searchParams.entries()),
      headers: headersObj,
      get(name) {
        return c.req.header(name)
      },
      ip,
      user: c.get('user'),
      currentUser: c.get('currentUser'),
      accessSummary: c.get('accessSummary'),
      connection: { remoteAddress: ip },
    }

    let _status = 200
    let _body = null
    const _headers = new Headers()

    const res = {
      status(code) {
        _status = code
        return res
      },
      json(data) {
        _body = data
        _headers.set('Content-Type', 'application/json')
        return res
      },
      send(data) {
        _body = data
        return res
      },
      setHeader(name, value) {
        if (Array.isArray(value)) {
          value.forEach((v) => _headers.append(name, v))
        } else {
          _headers.set(name, value)
        }
        return res
      },
      _toResponse() {
        const body =
          _body === null || _body === undefined
            ? null
            : typeof _body === 'string'
              ? _body
              : JSON.stringify(_body)
        return new Response(body, { status: _status, headers: _headers })
      },
    }

    let nextCalled = false
    const nextFn = () => {
      nextCalled = true
    }

    await fn(req, res, nextFn)

    if (nextCalled) {
      // Propagate values that middleware may have attached
      if (req.user !== undefined) c.set('user', req.user)
      if (req.currentUser !== undefined) c.set('currentUser', req.currentUser)
      if (req.accessSummary !== undefined) c.set('accessSummary', req.accessSummary)
      await next()
    } else {
      // Middleware short-circuited (e.g. 401) — return its response
      return res._toResponse()
    }
  }
}

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------
const app = new Hono()

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PUBLIC_URL,
  'https://plumar.com.br',
  'https://www.plumar.com.br',
  'https://andersonassissouza.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]
  .flatMap((v) => String(v || '').split(','))
  .map((v) => v.trim())
  .filter(Boolean)

app.use(
  '/*',
  cors({
    origin: (origin) => {
      if (!origin) return '*'
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  }),
)

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use('/*', async (c, next) => {
  await next()
  c.res.headers.set('X-Content-Type-Options', 'nosniff')
  c.res.headers.set('X-Frame-Options', 'DENY')
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.CF_PAGES === '1'
  if (isProduction) {
    c.res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; frame-ancestors 'none'",
    )
    c.res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    )
  }
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (c) =>
  c.json({ status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() }),
)

// ===========================================================================
//  AUTH routes — /api/auth
// ===========================================================================
const auth = new Hono()

auth.post('/register', wrapMiddleware(registerLimiter), wrapHandler(authController.register))
auth.post('/login', wrapMiddleware(loginLimiter), wrapHandler(authController.login))
auth.post('/forgot-password', wrapMiddleware(loginLimiter), wrapHandler(authController.forgotPassword))
auth.post('/reset-password', wrapMiddleware(registerLimiter), wrapHandler(authController.resetPassword))
auth.get('/me', wrapMiddleware(authMiddleware), wrapHandler(authController.me))
auth.post('/logout', wrapMiddleware(authMiddleware), wrapHandler(authController.logout))

app.route('/api/auth', auth)

// ===========================================================================
//  ACCESS routes — /api/access
// ===========================================================================
const access = new Hono()

// Group middleware: authMiddleware + apiLimiter + attachCurrentUser
access.use('/*', wrapMiddleware(authMiddleware))
access.use('/*', wrapMiddleware(apiLimiter))
access.use('/*', wrapMiddleware(attachCurrentUser))

access.get('/me', wrapHandler(accessController.getMyAccess))
access.post('/request', wrapMiddleware(csrfProtection), wrapHandler(accessController.requestSubscription))
access.post('/checkout', wrapMiddleware(csrfProtection), wrapHandler(accessController.createCheckout))
access.post('/checkout/:paymentId/confirm', wrapMiddleware(csrfProtection), wrapHandler(accessController.confirmInternalPayment))
access.post('/checkout/reconcile', wrapMiddleware(csrfProtection), wrapHandler(accessController.reconcileCheckout))
access.post('/cancel', wrapMiddleware(csrfProtection), wrapHandler(accessController.cancelMySubscription))

// Admin endpoints
access.get('/admin/subscribers', wrapMiddleware(requireOwner), wrapHandler(accessController.listSubscribers))
access.post('/admin/subscribers/:userId/grant', wrapMiddleware(requireOwner), wrapMiddleware(csrfProtection), wrapHandler(accessController.grantAccess))
access.post('/admin/subscribers/:userId/extend-trial', wrapMiddleware(requireOwner), wrapMiddleware(csrfProtection), wrapHandler(accessController.extendTrial))
access.post('/admin/subscribers/:userId/revoke', wrapMiddleware(requireOwner), wrapMiddleware(csrfProtection), wrapHandler(accessController.revokeAccess))
access.post('/admin/payments/:paymentId/approve', wrapMiddleware(requireOwner), wrapMiddleware(csrfProtection), wrapHandler(accessController.approvePayment))
access.post('/admin/payments/:paymentId/reject', wrapMiddleware(requireOwner), wrapMiddleware(csrfProtection), wrapHandler(accessController.rejectPayment))
access.delete('/admin/payments/:paymentId', wrapMiddleware(requireOwner), wrapMiddleware(csrfProtection), wrapHandler(accessController.deletePayment))

app.route('/api/access', access)

// ===========================================================================
//  PAYMENTS routes — /api/payments
// ===========================================================================
const payments = new Hono()

payments.post('/mercadopago/webhook', wrapHandler(paymentController.handleMercadoPagoWebhook))

// Register-webhook inline handler (ported from payments.routes.js)
payments.post('/mercadopago/register-webhook', async (c) => {
  try {
    const ownerKey = c.req.header('x-owner-key') || ''
    if (ownerKey !== process.env.OWNER_ACCESS_KEY) {
      return c.json({ message: 'Acesso negado.' }, 403)
    }

    const config = getPaymentGatewayConfig()
    if (!config.mercadoPago.accessToken) {
      return c.json({ message: 'MERCADOPAGO_ACCESS_TOKEN nao configurado.' }, 500)
    }

    const webhookUrl = `${config.backendPublicUrl}/api/payments/mercadopago/webhook`

    const authHeaders = {
      Authorization: `Bearer ${config.mercadoPago.accessToken}`,
      'Content-Type': 'application/json',
    }

    const results = {}

    // List existing webhooks
    try {
      const { data: existing } = await axios.get(
        'https://api.mercadopago.com/v1/notifications/webhooks',
        { headers: authHeaders },
      )
      results.existingWebhooks = existing
    } catch (e) {
      results.existingWebhooksError = e.response?.data || e.message
    }

    // Try registering
    try {
      const { data } = await axios.post(
        'https://api.mercadopago.com/v1/notifications',
        { url: webhookUrl, topics: ['payment'] },
        { headers: authHeaders },
      )
      results.registered = data
    } catch (e) {
      results.registerError = e.response?.data || e.message
    }

    // Try alternative endpoint
    try {
      const { data: apps } = await axios.get(
        'https://api.mercadopago.com/v1/applications/search',
        { headers: authHeaders },
      )
      results.applications = apps
    } catch (e) {
      results.appsError = e.response?.data || e.message
    }

    return c.json({
      success: true,
      webhookUrl,
      message:
        'O MercadoPago ja recebe notificacoes via notification_url em cada preferencia de checkout. URL configurada automaticamente.',
      diagnostics: results,
    })
  } catch (error) {
    console.error('[payments/register-webhook]', error.response?.data || error.message)
    return c.json(
      { message: 'Erro ao registrar webhook.', details: error.response?.data || error.message },
      500,
    )
  }
})

app.route('/api/payments', payments)

// ===========================================================================
//  CRUD group middleware helper
// ===========================================================================
function applyCrudMiddleware(router) {
  router.use('/*', wrapMiddleware(authMiddleware))
  router.use('/*', wrapMiddleware(requireAccess))
  router.use('/*', wrapMiddleware(apiLimiter))
}

// ===========================================================================
//  PLANTEL routes — /api/plantel
// ===========================================================================
const plantel = new Hono()
applyCrudMiddleware(plantel)

plantel.get('/', wrapHandler(plantelController.listar))
plantel.get('/:id', wrapHandler(plantelController.buscarPorId))
plantel.post('/', wrapMiddleware(csrfProtection), wrapHandler(plantelController.criar))
plantel.put('/:id', wrapMiddleware(csrfProtection), wrapHandler(plantelController.atualizar))
plantel.delete('/:id', wrapMiddleware(csrfProtection), wrapHandler(plantelController.remover))

app.route('/api/plantel', plantel)

// ===========================================================================
//  FILHOTES routes — /api/filhotes
// ===========================================================================
const filhotes = new Hono()
applyCrudMiddleware(filhotes)

filhotes.get('/', wrapHandler(filhotesController.list))
filhotes.put('/:id', wrapHandler(filhotesController.update))
filhotes.post('/:id/mark-death', wrapHandler(filhotesController.markDeath))
filhotes.post('/:id/transfer-to-plantel', wrapHandler(filhotesController.transferToPlantel))

app.route('/api/filhotes', filhotes)

// ===========================================================================
//  OVOS routes — /api/ovos
// ===========================================================================
const ovos = new Hono()
applyCrudMiddleware(ovos)

ovos.get('/', wrapHandler(ovosController.list))
ovos.post('/', wrapHandler(ovosController.create))
ovos.post('/restart-clutch', wrapHandler(ovosController.restartClutch))
ovos.post('/:id/status', wrapHandler(ovosController.updateStatus))

app.route('/api/ovos', ovos)

// ===========================================================================
//  GAIOLAS routes — /api/gaiolas
// ===========================================================================
const gaiolas = new Hono()
applyCrudMiddleware(gaiolas)

gaiolas.get('/', wrapHandler(gaiolasController.list))
gaiolas.post('/', wrapHandler(gaiolasController.create))
gaiolas.put('/:id', wrapHandler(gaiolasController.update))
gaiolas.delete('/:id', wrapHandler(gaiolasController.remove))

app.route('/api/gaiolas', gaiolas)

// ===========================================================================
//  CRIATORIO routes — /api/criatorios
// ===========================================================================
const criatorio = new Hono()
applyCrudMiddleware(criatorio)

criatorio.get('/me', wrapHandler(criatorioController.listarMeuCriatorio))
criatorio.post('/me', wrapMiddleware(csrfProtection), wrapHandler(criatorioController.criarMeuCriatorio))
criatorio.put('/me/:id', wrapMiddleware(csrfProtection), wrapHandler(criatorioController.atualizarMeuCriatorio))
criatorio.delete('/me/:id', wrapMiddleware(csrfProtection), wrapHandler(criatorioController.removerMeuCriatorio))

app.route('/api/criatorios', criatorio)

// ===========================================================================
//  ANEIS routes — /api/aneis
// ===========================================================================
const aneis = new Hono()
applyCrudMiddleware(aneis)

aneis.get('/', wrapHandler(aneisController.list))
aneis.post('/', wrapHandler(aneisController.create))
aneis.put('/:id', wrapHandler(aneisController.update))
aneis.delete('/:id', wrapHandler(aneisController.remove))

app.route('/api/aneis', aneis)

// ===========================================================================
//  SPECIES routes — /api/species
// ===========================================================================
const species = new Hono()
applyCrudMiddleware(species)

species.get('/lookup', wrapHandler(speciesController.lookup))
species.get('/', wrapHandler(speciesController.list))
species.post('/', wrapHandler(speciesController.create))
species.put('/:id', wrapHandler(speciesController.update))
species.delete('/:id', wrapHandler(speciesController.remove))

app.route('/api/species', species)

// ===========================================================================
//  MUTACOES routes — /api/mutacoes
// ===========================================================================
const mutacoes = new Hono()
applyCrudMiddleware(mutacoes)

mutacoes.get('/', wrapHandler(mutacoesController.list))
mutacoes.post('/', wrapHandler(mutacoesController.create))

app.route('/api/mutacoes', mutacoes)

// ===========================================================================
//  CUPONS routes — /api/cupons
// ===========================================================================
const cupons = new Hono()

// Rotas públicas (sem auth)
cupons.get('/validar', wrapMiddleware(apiLimiter), wrapHandler(cuponsController.validarCupomPublico))
cupons.get('/ranking', wrapMiddleware(apiLimiter), wrapHandler(cuponsController.rankingPublico))

// Demais rotas — autenticadas
cupons.use('/*', wrapMiddleware(authMiddleware))
cupons.use('/*', wrapMiddleware(attachCurrentUser))
cupons.use('/*', wrapMiddleware(apiLimiter))

cupons.get('/meu-programa', wrapHandler(cuponsController.meuPrograma))
cupons.post('/meu-programa/:id/solicitar-payout', wrapHandler(cuponsController.solicitarPayout))

cupons.get('/payout-requests', wrapMiddleware(requireOwner), wrapHandler(cuponsController.listPayoutRequestsAdmin))
cupons.get('/', wrapMiddleware(requireOwner), wrapHandler(cuponsController.listCuponsAdmin))
cupons.post('/', wrapMiddleware(requireOwner), wrapHandler(cuponsController.createCupomAdmin))
cupons.get('/:id', wrapMiddleware(requireOwner), wrapHandler(cuponsController.detalhesCupomAdmin))
cupons.put('/:id', wrapMiddleware(requireOwner), wrapHandler(cuponsController.updateCupomAdmin))
cupons.delete('/:id', wrapMiddleware(requireOwner), wrapHandler(cuponsController.deleteCupomAdmin))
cupons.post('/:id/payout', wrapMiddleware(requireOwner), wrapHandler(cuponsController.registrarPayoutAdmin))

app.route('/api/cupons', cupons)

// ===========================================================================
//  SHAREPOINT routes — /api/sharepoint
// ===========================================================================
const sharepoint = new Hono()
sharepoint.use('/*', wrapMiddleware(authMiddleware))
sharepoint.use('/*', wrapMiddleware(apiLimiter))
sharepoint.use('/*', wrapMiddleware(requireOwner))

sharepoint.get('/me/snapshot', wrapHandler(sharepointImportController.getMyImportedData))
sharepoint.post('/me/import', wrapMiddleware(csrfProtection), wrapHandler(sharepointImportController.importMyData))

app.route('/api/sharepoint', sharepoint)

// ===========================================================================
//  META routes — /api/meta (agendamento via Graph API — owner only)
// ===========================================================================
const metaController = require('./controllers/meta.controller')
const meta = new Hono()
meta.use('/*', wrapMiddleware(authMiddleware))
meta.use('/*', wrapMiddleware(apiLimiter))
meta.use('/*', wrapMiddleware(requireOwner))

meta.get('/scheduled', wrapHandler(metaController.listScheduled))
meta.post('/schedule', wrapMiddleware(csrfProtection), wrapHandler(metaController.scheduleOne))
meta.get('/scheduled/:id', wrapHandler(metaController.getScheduled))
meta.post('/scheduled/:id/cancel', wrapMiddleware(csrfProtection), wrapHandler(metaController.cancelScheduled))
meta.delete('/scheduled/:id', wrapMiddleware(csrfProtection), wrapHandler(metaController.deleteScheduled))
meta.post('/scheduled/:id/publish-now', wrapMiddleware(csrfProtection), wrapHandler(metaController.publishNow))
meta.post('/sweep', wrapMiddleware(csrfProtection), wrapHandler(metaController.runDueSweep))

app.route('/api/meta', meta)

// ===========================================================================
//  CONTACT routes — /api/contact  (inline, ported from contact.routes.js)
// ===========================================================================
const contact = new Hono()

// In-memory rate-limit store (same logic as the Express version)
const contactSubmissions = new Map()
const CONTACT_RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const CONTACT_MAX_SUBMISSIONS = 3

function checkContactRateLimit(ip) {
  const now = Date.now()
  const key = ip || 'unknown'
  const entry = contactSubmissions.get(key)

  if (!entry) {
    contactSubmissions.set(key, { count: 1, firstAt: now })
    return true
  }

  if (now - entry.firstAt > CONTACT_RATE_LIMIT_WINDOW) {
    contactSubmissions.set(key, { count: 1, firstAt: now })
    return true
  }

  if (entry.count >= CONTACT_MAX_SUBMISSIONS) {
    return false
  }

  entry.count++
  return true
}

/**
 * Save lead to PostgreSQL (non-blocking — failures don't stop the flow).
 */
async function saveLeadToDatabase(nome, email, origem, ip) {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return null

    const { Pool } = require('pg')
    const ssl =
      String(process.env.DATABASE_SSL || 'true').trim().toLowerCase() === 'false'
        ? false
        : { rejectUnauthorized: false }

    const pool = new Pool({ connectionString: dbUrl, ssl, max: 2 })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        origem VARCHAR(100) DEFAULT 'landing_page',
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        utm_content VARCHAR(100),
        ip VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads(email)
    `)

    const result = await pool.query(
      `INSERT INTO leads (nome, email, origem, utm_source, utm_medium, utm_campaign, utm_content, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET
         nome = EXCLUDED.nome,
         origem = EXCLUDED.origem,
         utm_source = COALESCE(EXCLUDED.utm_source, leads.utm_source),
         utm_medium = COALESCE(EXCLUDED.utm_medium, leads.utm_medium),
         utm_campaign = COALESCE(EXCLUDED.utm_campaign, leads.utm_campaign),
         utm_content = COALESCE(EXCLUDED.utm_content, leads.utm_content),
         created_at = NOW()
       RETURNING id`,
      [nome, email, origem || 'landing_page', null, null, null, null, ip],
    )

    await pool.end()
    return result.rows[0]?.id
  } catch (err) {
    console.error('[CONTACT] Erro ao salvar lead no banco:', err.message)
    return null
  }
}

// POST /api/contact
contact.post('/', async (c) => {
  try {
    let body = {}
    try {
      body = await c.req.json()
    } catch (_) {
      // empty
    }

    const { nome, email, utm_source, utm_medium, utm_campaign, utm_content } = body

    if (!nome || !email) {
      return c.json({ success: false, message: 'Nome e email sao obrigatorios.' }, 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, message: 'Email invalido.' }, 400)
    }

    const clientIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      '127.0.0.1'

    if (!checkContactRateLimit(clientIp)) {
      return c.json(
        { success: false, message: 'Muitas tentativas. Tente novamente mais tarde.' },
        429,
      )
    }

    const leadId = await saveLeadToDatabase(nome, email, utm_source || 'landing_page', clientIp)

    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const utmInfo = utm_source
      ? `\nOrigem: ${utm_source} / ${utm_medium || '-'} / ${utm_campaign || '-'}`
      : ''

    await sendEmail({
      to: {
        name: 'PLUMAR',
        email: 'plumarapp@plumar.com.br',
      },
      subject: `[PLUMAR] Novo cadastro: ${nome}`,
      text: [
        'Novo cadastro via landing page PLUMAR',
        '',
        `Nome: ${nome}`,
        `Email: ${email}`,
        `Data/Hora: ${now}`,
        leadId ? `Lead ID: ${leadId}` : '',
        utmInfo,
        '',
        '---',
        'Este email foi enviado automaticamente pelo formulario da pagina comercial.',
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f7f5f0; border-radius: 12px;">
          <div style="background: #2c2520; color: #f0d4c0; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 0; letter-spacing: 4px;">PLUMAR</h1>
            <p style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px;">Novo cadastro via landing page</p>
          </div>
          <div style="background: white; padding: 28px; border: 1px solid rgba(108,88,70,0.08); border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #8a7e74; font-size: 14px; width: 80px;">Nome</td>
                <td style="padding: 10px 0; color: #2c2520; font-size: 14px; font-weight: 600;">${nome}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #8a7e74; font-size: 14px; border-top: 1px solid #f0ebe4;">Email</td>
                <td style="padding: 10px 0; color: #2c2520; font-size: 14px; font-weight: 600; border-top: 1px solid #f0ebe4;">
                  <a href="mailto:${email}" style="color: #c97a50; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #8a7e74; font-size: 14px; border-top: 1px solid #f0ebe4;">Data</td>
                <td style="padding: 10px 0; color: #2c2520; font-size: 14px; border-top: 1px solid #f0ebe4;">${now}</td>
              </tr>
              ${
                utm_source
                  ? `<tr>
                <td style="padding: 10px 0; color: #8a7e74; font-size: 14px; border-top: 1px solid #f0ebe4;">Origem</td>
                <td style="padding: 10px 0; color: #2c2520; font-size: 14px; border-top: 1px solid #f0ebe4;">${utm_source} / ${utm_medium || '-'} / ${utm_campaign || '-'}</td>
              </tr>`
                  : ''
              }
            </table>
          </div>
        </div>
      `,
    })

    return c.json({
      success: true,
      message: 'Cadastro recebido com sucesso!',
      leadId: leadId || undefined,
    })
  } catch (error) {
    console.error('[CONTACT] Erro ao processar formulario:', error.message)
    return c.json({ success: false, message: 'Erro interno. Tente novamente.' }, 500)
  }
})

// GET /api/contact/leads
contact.get('/leads', async (c) => {
  try {
    const apiKey = c.req.header('x-api-key') || c.req.query('key')
    const expectedKey = process.env.LEADS_API_KEY || process.env.ADMIN_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return c.json({ success: false, message: 'Nao autorizado.' }, 401)
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return c.json({ success: false, message: 'Banco de dados nao configurado.' }, 503)
    }

    const { Pool } = require('pg')
    const ssl =
      String(process.env.DATABASE_SSL || 'true').trim().toLowerCase() === 'false'
        ? false
        : { rejectUnauthorized: false }

    const pool = new Pool({ connectionString: dbUrl, ssl, max: 2 })
    const result = await pool.query(
      'SELECT id, nome, email, origem, utm_source, utm_medium, utm_campaign, created_at FROM leads ORDER BY created_at DESC LIMIT 500',
    )
    await pool.end()

    return c.json({ success: true, total: result.rows.length, leads: result.rows })
  } catch (error) {
    console.error('[CONTACT] Erro ao listar leads:', error.message)
    return c.json({ success: false, message: 'Erro ao listar leads.' }, 500)
  }
})

app.route('/api/contact', contact)

// ===========================================================================
//  404 catch-all
// ===========================================================================
app.notFound((c) => c.json({ message: 'Rota nao encontrada.' }, 404))

// ===========================================================================
//  Global error handler
// ===========================================================================
app.onError((err, c) => {
  console.error('[worker] Unhandled error:', err)
  return c.json({ message: 'Erro interno do servidor.' }, 500)
})

// ===========================================================================
//  Cloudflare Workers export
// ===========================================================================
export default {
  async fetch(request, env, ctx) {
    // Copy env bindings to process.env so existing CJS modules work
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') process.env[key] = value
    }
    return app.fetch(request, env, ctx)
  },

  async scheduled(event, env, ctx) {
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') process.env[key] = value
    }
    // Despacha por cron expression (Cloudflare passa event.cron)
    const cron = event.cron || ''
    try {
      if (cron === '*/5 * * * *') {
        // Publicação de posts agendados via Meta Graph API
        const { runDueSweep } = require('./services/meta-publisher.service')
        const results = await runDueSweep({ limit: 5 })
        console.log('[cron meta] runDueSweep:', JSON.stringify(results))
      } else {
        // Default — lembretes de assinatura (cron 0 */12 * * *)
        const { runSubscriptionReminderSweep } = require('./services/subscription-reminder.service')
        await runSubscriptionReminderSweep()
      }
    } catch (err) {
      console.error('[cron error]', cron, err.message)
    }
  },
}
