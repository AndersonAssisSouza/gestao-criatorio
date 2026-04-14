const crypto = require('crypto')

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'plumar_auth'
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'plumar_csrf'

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function buildAccessKeys(user = {}) {
  const email = normalizeEmail(user.email)
  const localPart = email.split('@')[0] || ''
  const localPartTokens = localPart.split(/[^a-zA-Z0-9]+/).map(normalizeText).filter(Boolean)
  const nameTokens = normalizeText(user.name).split(/\s+/).filter(Boolean)

  return [...new Set([
    email,
    localPart,
    ...localPartTokens,
    normalizeText(user.name),
    ...nameTokens,
    normalizeText(user.accessKey),
  ])].filter(Boolean)
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf('=')
      if (separatorIndex < 0) return acc
      const key = part.slice(0, separatorIndex).trim()
      const value = decodeURIComponent(part.slice(separatorIndex + 1))
      acc[key] = value
      return acc
    }, {})
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`]

  if (options.maxAge !== undefined) segments.push(`Max-Age=${options.maxAge}`)
  if (options.domain) segments.push(`Domain=${options.domain}`)
  if (options.path) segments.push(`Path=${options.path}`)
  if (options.expires) segments.push(`Expires=${options.expires.toUTCString()}`)
  if (options.httpOnly) segments.push('HttpOnly')
  if (options.secure) segments.push('Secure')
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`)

  return segments.join('; ')
}

function getCookieOptions(httpOnly) {
  const sameSite = process.env.COOKIE_SAME_SITE || 'Lax'
  const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'

  return {
    path: '/',
    httpOnly,
    secure,
    sameSite,
  }
}

function buildAuthCookie(token) {
  const maxAgeSeconds = Number(process.env.AUTH_COOKIE_MAX_AGE_SECONDS || 60 * 60 * 24)
  return serializeCookie(AUTH_COOKIE_NAME, token, {
    ...getCookieOptions(true),
    maxAge: maxAgeSeconds,
  })
}

function buildCsrfCookie(token) {
  const maxAgeSeconds = Number(process.env.AUTH_COOKIE_MAX_AGE_SECONDS || 60 * 60 * 24)
  return serializeCookie(CSRF_COOKIE_NAME, token, {
    ...getCookieOptions(false),
    maxAge: maxAgeSeconds,
  })
}

function clearCookie(name, httpOnly) {
  return serializeCookie(name, '', {
    ...getCookieOptions(httpOnly),
    expires: new Date(0),
    maxAge: 0,
  })
}

function getClearedAuthCookies() {
  return [clearCookie(AUTH_COOKIE_NAME, true), clearCookie(CSRF_COOKIE_NAME, false)]
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

function getAuthCookieName() {
  return AUTH_COOKIE_NAME
}

function getCsrfCookieName() {
  return CSRF_COOKIE_NAME
}

module.exports = {
  buildAccessKeys,
  buildAuthCookie,
  buildCsrfCookie,
  createCsrfToken,
  getAuthCookieName,
  getClearedAuthCookies,
  getCsrfCookieName,
  normalizeEmail,
  normalizeText,
  parseCookies,
}
