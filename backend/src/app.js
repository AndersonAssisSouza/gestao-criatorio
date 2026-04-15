require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth.routes')
const accessRoutes = require('./routes/access.routes')
const paymentRoutes = require('./routes/payments.routes')
const plantelRoutes = require('./routes/plantel.routes')
const filhotesRoutes = require('./routes/filhotes.routes')
const ovosRoutes = require('./routes/ovos.routes')
const gaiolasRoutes = require('./routes/gaiolas.routes')
const criatorioRoutes = require('./routes/criatorio.routes')
const aneisRoutes = require('./routes/aneis.routes')
const sharepointImportRoutes = require('./routes/sharepoint-import.routes')
const contactRoutes = require('./routes/contact.routes')
const speciesRoutes = require('./routes/species.routes')
const mutacoesRoutes = require('./routes/mutacoes.routes')
const contactRoutes = require('./routes/contact.routes')
const securityHeaders = require('./middleware/security.middleware')
const { startSubscriptionReminderWorker } = require('./services/subscription-reminder.service')

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PUBLIC_URL,
  'https://plumar.com.br',
  'https://www.plumar.com.br',
  'https://andersonassissouza.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:4175',
]
  .flatMap((value) => String(value || '').split(','))
  .map((value) => value.trim())
  .filter(Boolean)

function isAllowedOrigin(origin = '') {
  if (allowedOrigins.includes(origin)) {
    return true
  }

  if (process.env.NODE_ENV !== 'production') {
    return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  }

  return false
}

// ─── Middlewares globais ──────────────────────────────────────────────────────
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(securityHeaders)
app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origem não permitida pelo CORS.'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}))
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '100kb' }))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() }))

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes)
app.use('/api/access', accessRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/criatorios', criatorioRoutes)
app.use('/api/aneis', aneisRoutes)
app.use('/api/plantel', plantelRoutes)
app.use('/api/filhotes', filhotesRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/ovos', ovosRoutes)
app.use('/api/gaiolas', gaiolasRoutes)
app.use('/api/sharepoint', sharepointImportRoutes)
app.use('/api/species', speciesRoutes)
app.use('/api/mutacoes', mutacoesRoutes)
app.use('/api/contact', contactRoutes)

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ message: 'Rota não encontrada.' }))

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _, res, __) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ message: 'Erro interno do servidor.' })
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🐦 Gestão Criatório API rodando na porta ${PORT}`)
    startSubscriptionReminderWorker()
  })
}

module.exports = app
