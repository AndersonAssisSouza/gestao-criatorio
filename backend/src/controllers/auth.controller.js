const bcrypt = require('bcryptjs')
const { SignJWT, jwtVerify } = require('jose')
const crypto = require('crypto')
const userRepository = require('../repositories/user.repository')
const { sendEmail } = require('../services/email.service')
const {
  buildAccessKeys,
  buildAuthCookie,
  buildCsrfCookie,
  createCsrfToken,
  getClearedAuthCookies,
  normalizeEmail,
} = require('../utils/security.utils')
const {
  buildAccessSummary,
  createLifetimeProfile,
  getOwnerSeed,
  isOwnerEmail,
} = require('../utils/subscription.utils')

const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60)

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean)
}

function isStrongPassword(password = '') {
  return (
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  )
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function signToken(user) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
    accessKey: user.accessKey,
    accessKeys: buildAccessKeys(user),
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(process.env.JWT_ISSUER || 'plumar-api')
    .setAudience(process.env.JWT_AUDIENCE || 'plumar-web')
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '12h')
    .sign(secret)
}

function setSessionCookies(res, token) {
  const csrfToken = createCsrfToken()
  res.setHeader('Set-Cookie', [buildAuthCookie(token), buildCsrfCookie(csrfToken)])
}

function serializeUser(user) {
  return {
    ...userRepository.sanitizeUser(user),
    access: buildAccessSummary(user),
  }
}

function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  return { rawToken, tokenHash }
}

function buildPasswordResetLink(rawToken) {
  const baseUrl = String(
    process.env.FRONTEND_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    'http://127.0.0.1:4173'
  ).trim().replace(/\/+$/, '')

  return `${baseUrl}/?mode=reset-password&token=${encodeURIComponent(rawToken)}`
}

function isPasswordResetTokenValid(user, rawToken) {
  if (!user?.passwordResetTokenHash || !user?.passwordResetExpiresAt || !rawToken) {
    return false
  }

  const expectedHash = crypto.createHash('sha256').update(String(rawToken)).digest('hex')
  const expiresAt = new Date(user.passwordResetExpiresAt).getTime()

  return user.passwordResetTokenHash === expectedHash && Number.isFinite(expiresAt) && expiresAt > Date.now()
}

async function dispatchPasswordReset(user, rawToken) {
  const resetLink = buildPasswordResetLink(rawToken)
  const result = await sendEmail({
    to: { name: user.name, email: user.email },
    subject: 'Recuperação de senha - Plumar',
    text: [
      `Olá, ${user.name}.`,
      '',
      'Recebemos um pedido para redefinir a sua senha no Plumar.',
      `Abra este link para criar uma nova senha: ${resetLink}`,
      '',
      `Este link expira em ${PASSWORD_RESET_TTL_MINUTES} minutos.`,
      'Se você não solicitou a troca, pode ignorar este e-mail.',
    ].join('\n'),
    html: [
      `<p>Olá, <strong>${user.name}</strong>.</p>`,
      '<p>Recebemos um pedido para redefinir a sua senha no Plumar.</p>',
      `<p><a href="${resetLink}">Clique aqui para criar uma nova senha</a></p>`,
      `<p>Este link expira em ${PASSWORD_RESET_TTL_MINUTES} minutos.</p>`,
      '<p>Se você não solicitou a troca, pode ignorar este e-mail.</p>',
    ].join(''),
  })

  return {
    ...result,
    resetLink,
  }
}

async function ensureOwnerUser() {
  const ownerSeed = getOwnerSeed()
  if (!ownerSeed) return null

  const passwordHash = await bcrypt.hash(ownerSeed.password, 12)
  const existing = await userRepository.ensureUser({
    name: ownerSeed.name,
    email: ownerSeed.email,
    passwordHash,
    role: ownerSeed.role,
    accessKey: ownerSeed.accessKey,
    profile: createLifetimeProfile(),
  })

  await userRepository.updateUser(existing.id, (current) => ({
    ...current,
    name: ownerSeed.name,
    role: 'owner',
    accessKey: ownerSeed.accessKey,
    passwordHash,
    ...createLifetimeProfile(current.createdAt || new Date().toISOString()),
  }))
}

async function register(req, res) {
  try {
    await ensureOwnerUser()
    const name = String(req.body?.name || '').trim()
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' })
    }

    if (name.length < 3 || name.length > 80) {
      return res.status(400).json({ message: 'Nome deve ter entre 3 e 80 caracteres.' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Informe um e-mail válido.' })
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Senha deve ter ao menos 8 caracteres e conter letras e números.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const role = isOwnerEmail(email) ? 'owner' : (getAdminEmails().includes(email) ? 'admin' : 'user')
    const user = await userRepository.createUser({ name, email, passwordHash, role })
    const token = await signToken(user)

    setSessionCookies(res, token)
    return res.status(201).json({ user: serializeUser(user), token })
  } catch (error) {
    console.error('[auth/register]', error)

    if (error.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: 'E-mail já cadastrado.' })
    }

    return res.status(500).json({ message: 'Erro ao registrar usuário.' })
  }
}

async function login(req, res) {
  try {
    await ensureOwnerUser()
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' })
    }

    const user = await userRepository.findByEmail(email)
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.', debug: { reason: 'user_not_found', email } })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({
        message: 'Credenciais inválidas.',
        debug: {
          reason: 'password_mismatch',
          email: user.email,
          role: user.role,
          hashPrefix: String(user.passwordHash || '').slice(0, 15),
          ownerEnvEmail: String(process.env.OWNER_EMAIL || '').replace(/[\r\n]+$/g, '').toLowerCase(),
          ownerEnvPassSet: Boolean(process.env.OWNER_PASSWORD),
          ownerEnvPassLen: String(process.env.OWNER_PASSWORD || '').length,
        },
      })
    }

    const safeUser = serializeUser(user)
    const token = await signToken(safeUser)

    setSessionCookies(res, token)
    return res.json({ user: safeUser, token })
  } catch (error) {
    console.error('[auth/login]', error)
    return res.status(500).json({ message: 'Erro ao fazer login.' })
  }
}

async function me(req, res) {
  try {
    await ensureOwnerUser()
    const user = await userRepository.findById(req.user.userId)

    if (!user) {
      res.setHeader('Set-Cookie', getClearedAuthCookies())
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }

    return res.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('[auth/me]', error)
    return res.status(500).json({ message: 'Erro ao buscar usuário.' })
  }
}

async function logout(_, res) {
  res.setHeader('Set-Cookie', getClearedAuthCookies())
  return res.status(204).send()
}

async function forgotPassword(req, res) {
  try {
    await ensureOwnerUser()
    const email = normalizeEmail(req.body?.email)

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Informe um e-mail válido.' })
    }

    const user = await userRepository.findByEmail(email)
    if (!user) {
      return res.json({
        message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
      })
    }

    const { rawToken, tokenHash } = createPasswordResetToken()
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000).toISOString()

    await userRepository.updateUser(user.id, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
      passwordResetRequestedAt: new Date().toISOString(),
    })

    let delivery

    try {
      delivery = await dispatchPasswordReset(user, rawToken)
    } catch (deliveryError) {
      console.error('[auth/forgotPassword/delivery]', deliveryError)

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          message: 'O serviço de e-mail está indisponível no momento. Use o link de recuperação de teste abaixo neste ambiente local.',
          delivery: {
            delivered: false,
            skipped: true,
          },
          previewResetLink: buildPasswordResetLink(rawToken),
        })
      }

      return res.status(502).json({
        message: 'Não foi possível enviar o e-mail de recuperação agora. Tente novamente em instantes.',
      })
    }

    return res.json({
      message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
      delivery: {
        delivered: delivery.delivered,
        skipped: delivery.skipped || false,
      },
      previewResetLink: process.env.NODE_ENV !== 'production' ? delivery.resetLink : undefined,
    })
  } catch (error) {
    console.error('[auth/forgotPassword]', error)
    return res.status(500).json({ message: 'Erro ao iniciar recuperação de senha.' })
  }
}

async function resetPassword(req, res) {
  try {
    await ensureOwnerUser()
    const token = String(req.body?.token || '').trim()
    const password = String(req.body?.password || '')

    if (!token) {
      return res.status(400).json({ message: 'Token de recuperação é obrigatório.' })
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Senha deve ter ao menos 8 caracteres e conter letras e números.',
      })
    }

    const users = await userRepository.readUsers()
    const user = users.find((entry) => isPasswordResetTokenValid(entry, token))

    if (!user) {
      return res.status(400).json({ message: 'Link de recuperação inválido ou expirado.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await userRepository.updateUser(user.id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordResetRequestedAt: null,
    })

    return res.json({ message: 'Senha atualizada com sucesso. Faça login com a nova senha.' })
  } catch (error) {
    console.error('[auth/resetPassword]', error)
    return res.status(500).json({ message: 'Erro ao redefinir senha.' })
  }
}

module.exports = { forgotPassword, login, logout, me, register, resetPassword }
