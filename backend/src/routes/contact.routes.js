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
 * POST /api/contact
 * Recebe dados do formulário da landing page e envia por email
 */
router.post('/', async (req, res) => {
  try {
    const { nome, email } = req.body

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

    // Envia email de notificação para o PLUMAR
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

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
        '',
        '---',
        'Este email foi enviado automaticamente pelo formulário da página comercial.',
      ].join('\n'),
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
            </table>
          </div>
        </div>
      `,
    })

    return res.status(200).json({
      success: true,
      message: 'Cadastro recebido com sucesso!',
    })
  } catch (error) {
    console.error('[CONTACT] Erro ao processar formulário:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar cadastro. Tente novamente.',
    })
  }
})

module.exports = router
