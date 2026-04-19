const path = require('path')
const crypto = require('crypto')
const { normalizeEmail, normalizeText } = require('../utils/security.utils')
const { createTrialProfile } = require('../utils/subscription.utils')
const storageEngine = require('./storage.engine')

const DEFAULT_STORAGE_DIR = storageEngine.DEFAULT_STORAGE_DIR
const STORAGE_FILE = process.env.USER_STORE_PATH || path.join(DEFAULT_STORAGE_DIR, 'users.json')

async function readUsers() {
  const users = await storageEngine.readCollection('users', STORAGE_FILE)
  return Array.isArray(users) ? users.map(hydrateUser) : []
}

function hydrateUser(user) {
  if (!user) return null

  if (user.subscriptionStatus) {
    return {
      notificationHistory: [],
      ...user,
      notificationHistory: Array.isArray(user.notificationHistory) ? user.notificationHistory : [],
    }
  }

  return {
    ...user,
    ...createTrialProfile(user.createdAt || new Date().toISOString()),
    isLifetimeOwner: false,
    notificationHistory: Array.isArray(user.notificationHistory) ? user.notificationHistory : [],
  }
}

async function writeUsers(users) {
  await storageEngine.writeCollection('users', users, STORAGE_FILE)
}

function sanitizeUser(user) {
  if (!user) return null

  const {
    passwordHash,
    notificationHistory,
    passwordResetTokenHash,
    passwordResetExpiresAt,
    passwordResetRequestedAt,
    emailVerifyTokenHash,
    emailVerifyExpiresAt,
    emailVerifyRequestedAt,
    failedLoginCount,
    failedLoginWindowStart,
    lockedUntil,
    ...safeUser
  } = user

  return safeUser
}

async function findByEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  const users = await readUsers()
  return users.find((user) => user.email === normalizedEmail) || null
}

async function findById(id) {
  const users = await readUsers()
  return users.find((user) => user.id === id) || null
}

async function createUser({ name, email, passwordHash, role = 'user', cupomReferenciador = null, cupomReferenciadorDataCaptura = null }) {
  return queueWrite(async () => {
    const users = await readUsers()
    const normalizedEmail = normalizeEmail(email)

    if (users.some((user) => user.email === normalizedEmail)) {
      const error = new Error('E-mail já cadastrado.')
      error.code = 'EMAIL_EXISTS'
      throw error
    }

    const now = new Date().toISOString()
    const user = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      accessKey: normalizeText(name) || normalizedEmail.split('@')[0],
      createdAt: now,
      updatedAt: now,
      cupomReferenciador,
      cupomReferenciadorDataCaptura,
      emailVerified: false,
      emailVerifyTokenHash: null,
      emailVerifyExpiresAt: null,
      emailVerifyRequestedAt: null,
      tokenVersion: 0,
      ...createTrialProfile(now),
      isLifetimeOwner: false,
    }

    users.push(user)
    await writeUsers(users)
    return sanitizeUser(user)
  })
}

function queueWrite(task) {
  return storageEngine.runWithCollectionLock('users', task)
}

async function ensureUser(seedUser) {
  return queueWrite(async () => {
    const users = await readUsers()
    const normalizedEmail = normalizeEmail(seedUser.email)
    const existing = users.find((user) => user.email === normalizedEmail)

    if (existing) {
      return existing
    }

    const now = new Date().toISOString()
    const user = {
      id: crypto.randomUUID(),
      name: String(seedUser.name).trim(),
      email: normalizedEmail,
      passwordHash: seedUser.passwordHash,
      role: seedUser.role || 'user',
      accessKey: normalizeText(seedUser.accessKey || seedUser.name) || normalizedEmail.split('@')[0],
      createdAt: now,
      updatedAt: now,
      ...createTrialProfile(now),
      isLifetimeOwner: false,
      ...(seedUser.profile || {}),
    }

    users.push(user)
    await writeUsers(users)
    return user
  })
}

async function updateUser(id, updater) {
  return queueWrite(async () => {
    const users = await readUsers()
    const index = users.findIndex((user) => user.id === id)
    if (index < 0) return null

    const current = users[index]
    const nextUser = typeof updater === 'function'
      ? updater(current)
      : { ...current, ...updater }

    users[index] = {
      ...nextUser,
      id: current.id,
      email: current.email,
      updatedAt: new Date().toISOString(),
    }

    await writeUsers(users)
    return users[index]
  })
}

async function listUsers() {
  const users = await readUsers()
  return users.map(sanitizeUser)
}

module.exports = {
  createUser,
  ensureUser,
  findByEmail,
  findById,
  listUsers,
  readUsers,
  sanitizeUser,
  updateUser,
}
