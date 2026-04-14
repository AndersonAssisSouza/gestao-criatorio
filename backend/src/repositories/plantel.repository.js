const path = require('path')
const crypto = require('crypto')
const storageEngine = require('./storage.engine')

const DEFAULT_STORAGE_DIR = storageEngine.DEFAULT_STORAGE_DIR
const STORAGE_FILE = process.env.PLANTEL_STORE_PATH || path.join(DEFAULT_STORAGE_DIR, 'plantel.json')

async function readPlantel() {
  const items = await storageEngine.readCollection('plantel', STORAGE_FILE)
  return Array.isArray(items) ? items : []
}

async function writePlantel(items) {
  await storageEngine.writeCollection('plantel', items, STORAGE_FILE)
}

function sanitizeAve(item) {
  if (!item) return null

  return {
    id: item.id,
    nome: item.nome || '',
    status: item.status || 'Vivo',
    nomeMae: item.nomeMae || '',
    nomePai: item.nomePai || '',
    gaiola: item.gaiola || '',
    dataNascimento: item.dataNascimento || '',
    categoriaAve: item.categoriaAve || '',
    genero: item.genero || '',
    origem: item.origem || '',
    registroFOB: item.registroFOB || '',
    anelEsquerdo: item.anelEsquerdo || '',
    mutacao: item.mutacao || '',
    observacao: item.observacao || '',
    criatorioId: item.criatorioId,
    userId: item.userId,
    sharepointItemId: item.sharepointItemId || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

async function listByCriatorioId(criatorioId) {
  const items = await readPlantel()
  return items
    .filter((entry) => entry.criatorioId === criatorioId)
    .map(sanitizeAve)
}

async function findById(id) {
  const items = await readPlantel()
  const item = items.find((entry) => entry.id === id)
  return sanitizeAve(item)
}

async function createAve(payload) {
  return queueWrite(async () => {
    const items = await readPlantel()
    const now = new Date().toISOString()
    const item = {
      id: crypto.randomUUID(),
      nome: String(payload.nome || '').trim(),
      status: String(payload.status || 'Vivo').trim() || 'Vivo',
      nomeMae: String(payload.nomeMae || '').trim(),
      nomePai: String(payload.nomePai || '').trim(),
      gaiola: String(payload.gaiola || '').trim(),
      dataNascimento: String(payload.dataNascimento || '').trim(),
      categoriaAve: String(payload.categoriaAve || '').trim(),
      genero: String(payload.genero || '').trim(),
      origem: String(payload.origem || '').trim(),
      registroFOB: String(payload.registroFOB || '').trim(),
      anelEsquerdo: String(payload.anelEsquerdo || '').trim(),
      mutacao: String(payload.mutacao || '').trim(),
      observacao: String(payload.observacao || '').trim(),
      criatorioId: payload.criatorioId,
      userId: payload.userId,
      sharepointItemId: payload.sharepointItemId || null,
      createdAt: now,
      updatedAt: now,
    }

    items.push(item)
    await writePlantel(items)
    return sanitizeAve(item)
  })
}

async function replaceByCriatorioId(criatorioId, payloads = []) {
  return queueWrite(async () => {
    const items = await readPlantel()
    const preserved = items.filter((entry) => entry.criatorioId !== criatorioId)
    const now = new Date().toISOString()

    const imported = payloads.map((payload) => ({
      id: crypto.randomUUID(),
      nome: String(payload.nome || '').trim(),
      status: String(payload.status || 'Vivo').trim() || 'Vivo',
      nomeMae: String(payload.nomeMae || '').trim(),
      nomePai: String(payload.nomePai || '').trim(),
      gaiola: String(payload.gaiola || '').trim(),
      dataNascimento: String(payload.dataNascimento || '').trim(),
      categoriaAve: String(payload.categoriaAve || '').trim(),
      genero: String(payload.genero || '').trim(),
      origem: String(payload.origem || '').trim(),
      registroFOB: String(payload.registroFOB || '').trim(),
      anelEsquerdo: String(payload.anelEsquerdo || '').trim(),
      mutacao: String(payload.mutacao || '').trim(),
      observacao: String(payload.observacao || '').trim(),
      criatorioId: payload.criatorioId,
      userId: payload.userId,
      sharepointItemId: payload.sharepointItemId || null,
      createdAt: now,
      updatedAt: now,
    }))

    await writePlantel([...preserved, ...imported])
    return imported.map(sanitizeAve)
  })
}

async function updateAve(id, updater) {
  return queueWrite(async () => {
    const items = await readPlantel()
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
      criatorioId: current.criatorioId,
      userId: current.userId,
      updatedAt: new Date().toISOString(),
    }

    await writePlantel(items)
    return sanitizeAve(items[index])
  })
}

async function deleteAve(id) {
  return queueWrite(async () => {
    const items = await readPlantel()
    const nextItems = items.filter((entry) => entry.id !== id)

    if (nextItems.length === items.length) {
      return false
    }

    await writePlantel(nextItems)
    return true
  })
}

function queueWrite(task) {
  return storageEngine.runWithCollectionLock('plantel', task)
}

module.exports = {
  createAve,
  deleteAve,
  findById,
  listByCriatorioId,
  readPlantel,
  replaceByCriatorioId,
  sanitizeAve,
  updateAve,
}
