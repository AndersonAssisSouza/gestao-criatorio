const express = require('express')
const { sendEmail } = require('../services/email.service')

const router = express.Router()

// Rate limiting simples em memória para evitar spam
const submissions = new Map()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hora
const MAX_SUBMISSIONS = 3 // máximo 3 por IP por hora

function checkRateLimit(ip) {
  const now = Date.now()
  const key = ip || 'unknown'
  const entry = submissions.get(key)

  if (!entry) {
    submissions.set(key, { count: 1, firstAt: now })
    return true
  }

  if (now - entry.firstAt > RATE_LIMIT_WINDOW) {
    submissions.set(key, { count: 1, firstAt: now })
    return true
  }

  if (entry.count >= MAX_SUBMISSIONS) {
    return false
  }

  entry.count++
  return true
}

// Limpa entradas antigas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of submissions) {
    if (now - entry.firstAt > RATE_LIMIT_WINDOW) {
      submissions.delete(key)
    }
  }
}, 10 * 60 * 1000) // a cada 10 minutos

/**
 * Salva lead no banco de dados PostgreSQL (se disponível)
 */
async function saveLeadToDatabase(nome, email, origem, ip) {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return null

    const { Pool } = require('pg')
    const ssl = String(process.env.DATABASE_SSL || 'true').trim().toLowerCase() === 'false'
      ? false
      : { rejectUnauthorized: false }

    const pool = new Pool({ connectionString: dbUrl, ssl, max: 2 })

    // Cria tabela se não existir
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

    // Cria índice único para evitar duplicatas
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads(email)
    `)

    // Insert com ON CONFLICT para atualizar nome e data se o email já existir
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
      [nome, email, origem || 'landing_page', null, null, null, null, ip]
    )

    await pool.end()
    return result.rows[0]?.id
  } catch (err) {
    console.error('[CONTACT] Erro ao salvar lead no banco:', err.message)
    return null // Não impede o fluxo se o banco falhar
  }
}

/**
 * GET /api/contact/leads
 * Lista leads cadastrados (protegido por API key simples)
 */
router.get('/leads', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.key
    const expectedKey = process.env.LEADS_API_KEY || process.env.ADMIN_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return res.status(401).json({ success: false, message: 'Não autorizado.' })
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return res.status(503).json({ success: false, message: 'Banco de dados não configurado.' })
    }

    const { Pool } = require('pg')
    const ssl = String(process.env.DATABASE_SSL || 'true').trim().toLowerCase() === 'false'
      ? false
      : { rejectUnauthorized: false }

    const pool = new Pool({ connectionString: dbUrl, ssl, max: 2 })
    const result = await pool.query('SELECT id, nome, email, origem, utm_source, utm_medium, utm_campaign, created_at FROM leads ORDER BY created_at DESC LIMIT 500')
    await pool.end()

    return res.status(200).json({
      success: true,
      total: result.rows.length,
      leads: result.rows,
    })
  } catch (error) {
    console.error('[CONTACT] Erro ao listar leads:', error.message)
    return res.status(500).json({ success: false, message: 'Erro ao listar leads.' })
  }
})

/**
 * POST /api/contact
 * Recebe dados do formulário da landing page, salva no banco e envia email
 */
router.post('/', async (req, res) => {
  try {
    const { nome, email, utm_source, utm_medium, utm_campaign, utm_content } = req.body

    // Validação básica
    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome e email são obrigatórios.',
      })
    }

    // Validação de email simples
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido.',
      })
    }

    // Rate limiting
    const clientIp = req.ip || req.connection?.remoteAddress
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        message: 'Muitas tentativas. Tente novamente mais tarde.',
      })
    }

    // Salva lead no banco de dados (não bloqueia se falhar)
    const leadId = await saveLeadToDatabase(nome, email, utm_source || 'landing_page', clientIp)

    // Envia email de notificação para o PLUMAR
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const utmInfo = utm_source ? `\nOrigem: ${utm_source} / ${utm_medium || '-'} / ${utm_campaign || '-'}` : ''

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
        'Este email foi enviado automaticamente pelo formulário da página comercial.',
      ].filter(Boolean).join('\n'),
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
              ${utm_source ? `<tr>
                <td style="padding: 10px 0; color: #8a7e74; font-size: 14px; border-top: 1px solid #f0ebe4;">Origem</td>
                <td style="padding: 10px 0; color: #2c2520; font-size: 14px; border-top: 1px solid #f0ebe4;">${utm_source} / ${utm_medium || '-'} / ${utm_campaign || '-'}</td>
              </tr>` : ''}
            </table>
          </div>
        </div>
      `,
    })

    return res.status(200).json({
      success: true,
      message: 'Cadastro recebido com sucesso!',
      leadId: leadId || undefined,
    })
  } catch (error) {
    console.error('[CONTACT] Erro ao processar formulário:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Erro interno. Tente novamente.',
    })
  }
})

module.exports = router