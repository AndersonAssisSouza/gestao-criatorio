const path = require('path')
const crypto = require('crypto')
const { normalizeEmail, normalizeText } = require('../utils/security.utils')
const storageEngine = require('./storage.engine')

const DEFAULT_STORAGE_DIR = storageEngine.DEFAULT_STORAGE_DIR
const STORAGE_FILE = process.env.CRIATORIO_STORE_PATH || path.join(DEFAULT_STORAGE_DIR, 'criatorios.json')

async function readCriatorios() {
  const items = await storageEngine.readCollection('criatorios', STORAGE_FILE)
  return Array.isArray(items) ? items : []
}

async function writeCriatorios(items) {
  await storageEngine.writeCollection('criatorios', items, STORAGE_FILE)
}

function sanitizeCriatorio(item) {
  if (!item) return null

  return {
    id: item.id,
    NomeCriatorio: item.NomeCriatorio || '',
    Responsavel: item.Responsavel || '',
    CTFCriador: item.CTFCriador || '',
    Endereco: item.Endereco || '',
    Acesso: item.Acesso || '',
    Telefone: item.Telefone || '',
    userId: item.userId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

async function listCriatorios() {
  const items = await readCriatorios()
  return items.map(sanitizeCriatorio)
}

async function findById(id) {
  const items = await readCriatorios()
  const item = items.find((entry) => entry.id === id)
  return sanitizeCriatorio(item)
}

async function findByUserId(userId) {
  const items = await readCriatorios()
  return items.filter((entry) => entry.userId === userId).map(sanitizeCriatorio)
}

async function findByAccess(access) {
  const normalizedAccess = normalizeText(access)
  const items = await readCriatorios()
  return items
    .filter((entry) => normalizeText(entry.Acesso) === normalizedAccess || normalizeEmail(entry.Acesso) === normalizeEmail(access))
    .map(sanitizeCriatorio)
}

async function createCriatorio(payload) {
  return queueWrite(async () => {
    const items = await readCriatorios()
    const now = new Date().toISOString()

    if (items.some((entry) => entry.userId === payload.userId)) {
      const error = new Error('USER_ALREADY_HAS_CRIATORIO')
      error.code = 'USER_ALREADY_HAS_CRIATORIO'
      throw error
    }

    const item = {
      id: crypto.randomUUID(),
      NomeCriatorio: String(payload.NomeCriatorio || '').trim(),
      Responsavel: String(payload.Responsavel || '').trim(),
      CTFCriador: String(payload.CTFCriador || '').trim(),
      Endereco: String(payload.Endereco || '').trim(),
      Acesso: normalizeEmail(payload.Acesso),
      Telefone: String(payload.Telefone || '').trim(),
      userId: payload.userId,
      createdAt: now,
      updatedAt: now,
    }

    items.push(item)
    await writeCriatorios(items)
    return sanitizeCriatorio(item)
  })
}

async function upsertCriatorioByUserId(userId, payload) {
  return queueWrite(async () => {
    const items = await readCriatorios()
    const index = items.findIndex((entry) => entry.userId === userId)
    const now = new Date().toISOString()

    if (index < 0) {
      const item = {
        id: crypto.randomUUID(),
        NomeCriatorio: String(payload.NomeCriatorio || '').trim(),
        Responsavel: String(payload.Responsavel || '').trim(),
        CTFCriador: String(payload.CTFCriador || '').trim(),
        Endereco: String(payload.Endereco || '').trim(),
        Acesso: normalizeEmail(payload.Acesso),
        Telefone: String(payload.Telefone || '').trim(),
        userId,
        createdAt: now,
        updatedAt: now,
        sharepointItemId: payload.sharepointItemId || null,
      }

      items.push(item)
      await writeCriatorios(items)
      return sanitizeCriatorio(item)
    }

    items[index] = {
      ...items[index],
      NomeCriatorio: String(payload.NomeCriatorio || items[index].NomeCriatorio || '').trim(),
      Responsavel: String(payload.Responsavel || items[index].Responsavel || '').trim(),
      CTFCriador: String(payload.CTFCriador || items[index].CTFCriador || '').trim(),
      Endereco: String(payload.Endereco || items[index].Endereco || '').trim(),
      Acesso: normalizeEmail(payload.Acesso || items[index].Acesso),
      Telefone: String(payload.Telefone || items[index].Telefone || '').trim(),
      sharepointItemId: payload.sharepointItemId || items[index].sharepointItemId || null,
      updatedAt: now,
    }

    await writeCriatorios(items)
    return sanitizeCriatorio(items[index])
  })
}

async function updateCriatorio(id, updater) {
  return queueWrite(async () => {
    const items = await readCriatorios()
    const index = items.findIndex((entry) => entry.id === id)
    if (index < 0) return null

    const current = items[index]
    const nextItem = typeof updater === 'function'
      ? updater(current)
      : { ...current, ...updater }

    items[index] = {
      ...current,
      ...nextItem,
      id: current.id,
      userId: current.userId,
      Acesso: normalizeEmail(current.Acesso),
      updatedAt: new Date().toISOString(),
    }

    await writeCriatorios(items)
    return sanitizeCriatorio(items[index])
  })
}

async function deleteCriatorio(id) {
  return queueWrite(async () => {
    const items = await readCriatorios()
    const nextItems = items.filter((entry) => entry.id !== id)

    if (nextItems.length === items.length) {
      return false
    }

    await writeCriatorios(nextItems)
    return true
  })
}

function queueWrite(task) {
  return storageEngine.runWithCollectionLock('criatorios', task)
}

module.exports = {
  createCriatorio,
  deleteCriatorio,
  findByAccess,
  findById,
  findByUserId,
  listCriatorios,
  readCriatorios,
  sanitizeCriatorio,
  upsertCriatorioByUserId,
  updateCriatorio,
}
