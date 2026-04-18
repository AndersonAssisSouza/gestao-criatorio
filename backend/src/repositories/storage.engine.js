let fs, path
try {
  fs = require('fs/promises')
  path = require('path')
} catch (_) {
  // Workers environment — file storage not available
}

const DEFAULT_STORAGE_DIR = (() => {
  if (!path) return '/tmp/storage'
  return process.env.VERCEL
    ? path.join('/tmp', 'storage')
    : path.join(process.cwd(), 'storage')
})()
const DEFAULT_TABLE_NAME = 'app_state'
const writeQueues = new Map()

let poolPromise = null
let tableReadyPromise = null

function hasDatabase() {
  return Boolean(String(process.env.DATABASE_URL || '').trim())
}

function getTableName() {
  const candidate = String(process.env.APP_STATE_TABLE || DEFAULT_TABLE_NAME).trim()
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(candidate) ? candidate : DEFAULT_TABLE_NAME
}

// Detecta se está rodando em ambiente Cloudflare Workers / Edge
function isEdgeRuntime() {
  // Workers expõem `navigator.userAgent === 'Cloudflare-Workers'` ou não têm `fs`
  if (typeof globalThis.WebSocketPair !== 'undefined') return true
  if (typeof navigator !== 'undefined' && /Cloudflare-Workers/i.test(navigator.userAgent || '')) return true
  if (!fs) return true
  return false
}

async function getPool() {
  if (!hasDatabase()) {
    return null
  }

  if (!poolPromise) {
    poolPromise = (async () => {
      // No Cloudflare Workers, usa driver HTTP serverless do Neon (compatível com Edge)
      if (isEdgeRuntime()) {
        const { neon } = require('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL)
        // Adapter com API similar ao pg.Pool: expõe .query(text, params)
        return {
          query: async (text, params = []) => {
            const rows = await sql.query(text, params)
            return { rows, rowCount: rows.length }
          },
        }
      }

      // Node tradicional (Vercel/local): usa pg com Pool
      const { Pool } = require('pg')
      const ssl = String(process.env.DATABASE_SSL || 'true').trim().toLowerCase() === 'false'
        ? false
        : { rejectUnauthorized: false }

      return new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl,
        max: Number(process.env.DATABASE_POOL_MAX || 5),
      })
    })()
  }

  return poolPromise
}

async function ensureTable() {
  if (!hasDatabase()) return

  if (!tableReadyPromise) {
    tableReadyPromise = (async () => {
      const pool = await getPool()
      const tableName = getTableName()

      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          collection_name TEXT PRIMARY KEY,
          data JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
    })()
  }

  return tableReadyPromise
}

async function ensureDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function ensureFile(filePath) {
  await ensureDirectory(filePath)

  try {
    await fs.access(filePath)
  } catch (_) {
    await fs.writeFile(filePath, '[]', 'utf8')
  }
}

async function readArrayFile(filePath) {
  await ensureFile(filePath)
  const raw = await fs.readFile(filePath, 'utf8')
  const items = JSON.parse(raw || '[]')
  return Array.isArray(items) ? items : []
}

async function writeArrayFile(filePath, items) {
  await ensureDirectory(filePath)
  await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf8')
  return items
}

async function readFromDatabase(collectionName) {
  await ensureTable()
  const pool = await getPool()
  const tableName = getTableName()
  const { rows } = await pool.query(
    `SELECT data FROM ${tableName} WHERE collection_name = $1 LIMIT 1`,
    [collectionName]
  )

  if (!rows.length) {
    return null
  }

  const items = rows[0]?.data
  return Array.isArray(items) ? items : []
}

async function writeToDatabase(collectionName, items) {
  await ensureTable()
  const pool = await getPool()
  const tableName = getTableName()
  const payload = JSON.stringify(Array.isArray(items) ? items : [])

  await pool.query(
    `
      INSERT INTO ${tableName} (collection_name, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (collection_name)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [collectionName, payload]
  )

  return items
}

async function readCollection(collectionName, filePath = path ? path.join(DEFAULT_STORAGE_DIR, `${collectionName}.json`) : '') {
  if (!hasDatabase()) {
    if (!fs) return []
    return readArrayFile(filePath)
  }

  const stored = await readFromDatabase(collectionName)
  if (stored) {
    return stored
  }

  // Fallback: tenta bootstrapar via arquivo JSON (dev). No Workers (sem fs) retorna [] e cria vazia.
  let bootstrapItems = []
  if (fs && filePath) {
    try {
      bootstrapItems = await readArrayFile(filePath)
    } catch (_) {
      bootstrapItems = []
    }
  }
  await writeToDatabase(collectionName, bootstrapItems)
  return bootstrapItems
}

async function writeCollection(collectionName, items, filePath = path ? path.join(DEFAULT_STORAGE_DIR, `${collectionName}.json`) : '') {
  if (!hasDatabase()) {
    if (!fs) return items
    return writeArrayFile(filePath, items)
  }

  return writeToDatabase(collectionName, items)
}

function runWithCollectionLock(collectionName, task) {
  const currentQueue = writeQueues.get(collectionName) || Promise.resolve()
  const nextQueue = currentQueue.then(task, task)
  writeQueues.set(collectionName, nextQueue.catch(() => {}))
  return nextQueue
}

module.exports = {
  DEFAULT_STORAGE_DIR,
  hasDatabase,
  readCollection,
  runWithCollectionLock,
  writeCollection,
}
