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
const EMAIL_VERIFY_TTL_HOURS = Number(process.env.EMAIL_VERIFY_TTL_HOURS || 48)

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean)
}

// Lista mínima de senhas óbvias a bloquear (cobertura básica).
// Para produção-grau recomenda-se integrar com HaveIBeenPwned k-anonymity.
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'senha123', 'qwerty123',
  'abc12345', 'abcd1234', 'plumar01', 'plumar123', 'admin123', 'letmein12',
  'password1', 'password12', 'password123', 'iloveyou1', 'qwerty1234',
  'welcome1', 'welcome12', 'monkey123', 'dragon123', 'master123',
])

function isStrongPassword(password = '') {
  const p = String(password || '')
  if (p.length < 10) return false
  if (p.length > 128) return false
  if (!/[a-z]/.test(p)) return false
  if (!/[A-Z]/.test(p)) return false
  if (!/\d/.test(p)) return false
  // Pelo menos 1 símbolo OU atinge 12+ chars
  if (p.length < 12 && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p)) return false
  // Bloqueia senhas óbvias
  if (COMMON_PASSWORDS.has(p.toLowerCase())) return false
  // Bloqueia sequências repetidas (ex: aaaaaaaa, 1111, abcabcabc)
  if (/^(.)\1+$/.test(p)) return false
  return true
}

function passwordPolicyMessage() {
  return 'Senha deve ter ao menos 10 caracteres, incluir maiúscula, minúscula, número e um símbolo (ou 12+ com letras e números).'
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function signToken(user) {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET não configurado ou muito curto (mínimo 32 caracteres).')
  }
  const secret = new TextEncoder().encode(jwtSecret)
  const payload = {
    // MED-04: tokenVersion permite revogação imediata de todas as sessões do user
    tokenVersion: Number(user.tokenVersion || 0),
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

function createEmailVerifyToken() {
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
    html: (() => {
      const { escapeHtml, escapeHtmlAttr } = require('../utils/html-escape.utils')
      const safeName = escapeHtml(user.name)
      const safeLink = escapeHtmlAttr(resetLink)
      return [
        `<p>Olá, <strong>${safeName}</strong>.</p>`,
        '<p>Recebemos um pedido para redefinir a sua senha no Plumar.</p>',
        `<p><a href="${safeLink}">Clique aqui para criar uma nova senha</a></p>`,
        `<p>Este link expira em ${PASSWORD_RESET_TTL_MINUTES} minutos.</p>`,
        '<p>Se você não solicitou a troca, pode ignorar este e-mail.</p>',
      ].join('')
    })(),
  })

  return {
    ...result,
    resetLink,
  }
}

function buildEmailVerifyLink(rawToken) {
  const baseUrl = String(
    process.env.FRONTEND_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    'http://127.0.0.1:4173'
  ).trim().replace(/\/+$/, '')

  return `${baseUrl}/?mode=verify-email&token=${encodeURIComponent(rawToken)}`
}

function isEmailVerifyTokenValid(user, rawToken) {
  if (!user?.emailVerifyTokenHash || !user?.emailVerifyExpiresAt || !rawToken) {
    return false
  }
  const expectedHash = crypto.createHash('sha256').update(String(rawToken)).digest('hex')
  const expiresAt = new Date(user.emailVerifyExpiresAt).getTime()
  return user.emailVerifyTokenHash === expectedHash && Number.isFinite(expiresAt) && expiresAt > Date.now()
}

async function dispatchEmailVerification(user, rawToken) {
  const verifyLink = buildEmailVerifyLink(rawToken)
  const { escapeHtml, escapeHtmlAttr } = require('../utils/html-escape.utils')
  const safeName = escapeHtml(user.name)
  const safeLink = escapeHtmlAttr(verifyLink)

  const result = await sendEmail({
    to: { name: user.name, email: user.email },
    subject: 'Confirme seu e-mail - Plumar',
    text: [
      `Olá, ${user.name}.`,
      '',
      'Bem-vindo(a) ao Plumar! Para ativar todos os recursos da conta, confirme seu endereço de e-mail.',
      `Abra este link: ${verifyLink}`,
      '',
      `Este link expira em ${EMAIL_VERIFY_TTL_HOURS} horas.`,
      'Se você não criou esta conta, pode ignorar este e-mail.',
    ].join('\n'),
    html: [
      `<p>Olá, <strong>${safeName}</strong>.</p>`,
      '<p>Bem-vindo(a) ao Plumar! Para ativar todos os recursos da conta, confirme seu endereço de e-mail.</p>',
      `<p><a href="${safeLink}">Clique aqui para confirmar seu e-mail</a></p>`,
      `<p>Este link expira em ${EMAIL_VERIFY_TTL_HOURS} horas.</p>`,
      '<p>Se você não criou esta conta, pode ignorar este e-mail.</p>',
    ].join(''),
  })

  return { ...result, verifyLink }
}

async function ensureOwnerUser() {
  const ownerSeed = getOwnerSeed()
  if (!ownerSeed) return null

  // OTIMIZAÇÃO: se owner já existe, retorna imediatamente.
  // (A verificação de senha será feita no login normal)
  const existingUser = await userRepository.findByEmail(ownerSeed.email)
  if (existingUser && existingUser.role === 'owner') {
    return existingUser
  }

  // Owner não existe → cria (bootstrap). Usa cost 10 para performance.
  const passwordHash = await bcrypt.hash(ownerSeed.password, 10)
  const created = await userRepository.ensureUser({
    name: ownerSeed.name,
    email: ownerSeed.email,
    passwordHash,
    role: ownerSeed.role,
    accessKey: ownerSeed.accessKey,
    profile: createLifetimeProfile(),
  })

  await userRepository.updateUser(created.id, (current) => ({
    ...current,
    name: ownerSeed.name,
    role: 'owner',
    accessKey: ownerSeed.accessKey,
    passwordHash,
    ...createLifetimeProfile(current.createdAt || new Date().toISOString()),
  }))

  return created
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
      return res.status(400).json({ message: passwordPolicyMessage() })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const role = isOwnerEmail(email) ? 'owner' : (getAdminEmails().includes(email) ? 'admin' : 'user')

    // Captura cupom de indicação no cadastro (se veio no body)
    const cupomReferenciador = String(req.body?.cupomReferenciador || req.body?.cupom || '').trim().toUpperCase()

    const user = await userRepository.createUser({
      name,
      email,
      passwordHash,
      role,
      cupomReferenciador: cupomReferenciador || null,
      cupomReferenciadorDataCaptura: cupomReferenciador ? new Date().toISOString() : null,
    })

    // Email verification token
    try {
      const { rawToken, tokenHash } = createEmailVerifyToken()
      const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000).toISOString()
      await userRepository.updateUser(user.id, (current) => ({
        ...current,
        emailVerified: false,
        emailVerifyTokenHash: tokenHash,
        emailVerifyExpiresAt: expiresAt,
        emailVerifyRequestedAt: new Date().toISOString(),
      }))
      // Dispatch async-ish (await but tolerate failure)
      await dispatchEmailVerification({ name, email }, rawToken).catch((err) => {
        console.warn('[auth/register/verify-email-dispatch]', err?.message || err)
      })
    } catch (dispatchError) {
      console.warn('[auth/register/verify-email]', dispatchError?.message || dispatchError)
    }

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
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
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

/**
 * MED-04: Revoga TODAS as sessões ativas do usuário autenticado
 * (incrementa tokenVersion — invalida qualquer JWT antigo).
 */
async function logoutAll(req, res) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ message: 'Sessão inválida.' })

    await userRepository.updateUser(userId, (current) => ({
      ...current,
      tokenVersion: Number(current.tokenVersion || 0) + 1,
    }))

    res.setHeader('Set-Cookie', getClearedAuthCookies())
    return res.json({ message: 'Todas as sessões foram encerradas. Faça login novamente.' })
  } catch (error) {
    console.error('[auth/logoutAll]', error)
    return res.status(500).json({ message: 'Erro ao revogar sessões.' })
  }
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
      return res.status(400).json({ message: passwordPolicyMessage() })
    }

    const users = await userRepository.readUsers()
    const user = users.find((entry) => isPasswordResetTokenValid(entry, token))

    if (!user) {
      return res.status(400).json({ message: 'Link de recuperação inválido ou expirado.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await userRepository.updateUser(user.id, (current) => ({
      ...current,
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordResetRequestedAt: null,
      // MED-04: incrementa tokenVersion para invalidar sessões antigas
      tokenVersion: Number(current.tokenVersion || 0) + 1,
    }))

    return res.json({ message: 'Senha atualizada com sucesso. Faça login com a nova senha.' })
  } catch (error) {
    console.error('[auth/resetPassword]', error)
    return res.status(500).json({ message: 'Erro ao redefinir senha.' })
  }
}

async function verifyEmail(req, res) {
  try {
    const token = String(req.query?.token || req.body?.token || '').trim()
    if (!token) {
      return res.status(400).json({ message: 'Token de verificação é obrigatório.' })
    }

    const users = await userRepository.readUsers()
    const user = users.find((entry) => isEmailVerifyTokenValid(entry, token))

    if (!user) {
      return res.status(400).json({ message: 'Link de verificação inválido ou expirado.' })
    }

    if (user.emailVerified) {
      return res.json({ message: 'E-mail já verificado anteriormente.' })
    }

    await userRepository.updateUser(user.id, (current) => ({
      ...current,
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      emailVerifyTokenHash: null,
      emailVerifyExpiresAt: null,
      emailVerifyRequestedAt: null,
    }))

    return res.json({ message: 'E-mail verificado com sucesso.' })
  } catch (error) {
    console.error('[auth/verifyEmail]', error)
    return res.status(500).json({ message: 'Erro ao verificar e-mail.' })
  }
}

async function resendVerification(req, res) {
  try {
    const userId = req.user?.userId
    const fallbackEmail = normalizeEmail(req.body?.email)
    const user = userId
      ? await userRepository.findById(userId)
      : (fallbackEmail ? await userRepository.findByEmail(fallbackEmail) : null)

    // Resposta genérica para não vazar existência
    const genericOk = { message: 'Se a conta existir e ainda não estiver verificada, reenviaremos o e-mail.' }

    if (!user) return res.json(genericOk)
    if (user.emailVerified) return res.json({ message: 'E-mail já verificado.' })

    // Throttle: 60s mínimos entre reenvios
    const last = user.emailVerifyRequestedAt ? new Date(user.emailVerifyRequestedAt).getTime() : 0
    if (last && Date.now() - last < 60 * 1000) {
      return res.status(429).json({ message: 'Aguarde alguns segundos antes de solicitar novamente.' })
    }

    const { rawToken, tokenHash } = createEmailVerifyToken()
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000).toISOString()

    await userRepository.updateUser(user.id, (current) => ({
      ...current,
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpiresAt: expiresAt,
      emailVerifyRequestedAt: new Date().toISOString(),
    }))

    try {
      await dispatchEmailVerification(user, rawToken)
    } catch (dispatchError) {
      console.error('[auth/resendVerification/dispatch]', dispatchError)
      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          ...genericOk,
          previewVerifyLink: buildEmailVerifyLink(rawToken),
        })
      }
      return res.status(502).json({ message: 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.' })
    }

    return res.json(genericOk)
  } catch (error) {
    console.error('[auth/resendVerification]', error)
    return res.status(500).json({ message: 'Erro ao reenviar verificação.' })
  }
}

module.exports = { forgotPassword, login, logout, logoutAll, me, register, resendVerification, resetPassword, verifyEmail }
