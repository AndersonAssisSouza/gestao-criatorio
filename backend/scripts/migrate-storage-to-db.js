require('dotenv').config()

const path = require('path')
const storageEngine = require('../src/repositories/storage.engine')

const COLLECTIONS = [
  { name: 'users', filePath: process.env.USER_STORE_PATH || path.join(storageEngine.DEFAULT_STORAGE_DIR, 'users.json') },
  { name: 'payments', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'payments.json') },
  { name: 'criatorios', filePath: process.env.CRIATORIO_STORE_PATH || path.join(storageEngine.DEFAULT_STORAGE_DIR, 'criatorios.json') },
  { name: 'plantel', filePath: process.env.PLANTEL_STORE_PATH || path.join(storageEngine.DEFAULT_STORAGE_DIR, 'plantel.json') },
  { name: 'aneis', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'aneis.json') },
  { name: 'gaiolas', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'gaiolas.json') },
  { name: 'filhotes', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'filhotes.json') },
  { name: 'especies', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'especies.json') },
  { name: 'financeiro', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'financeiro.json') },
  { name: 'mutacoes', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'mutacoes.json') },
  { name: 'ninhadas', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'ninhadas.json') },
  { name: 'listaItens', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'lista-itens.json') },
  { name: 'ovos', filePath: path.join(storageEngine.DEFAULT_STORAGE_DIR, 'ovos.json') },
]

async function main() {
  if (!storageEngine.hasDatabase()) {
    throw new Error('Defina DATABASE_URL antes de rodar a migração para Postgres.')
  }

  for (const collection of COLLECTIONS) {
    const items = await storageEngine.readCollection(collection.name, collection.filePath)
    await storageEngine.writeCollection(collection.name, items, collection.filePath)
    console.log(`[migrate-storage-to-db] ${collection.name}: ${items.length} registros migrados`)
  }
}

main()
  .then(() => {
    console.log('[migrate-storage-to-db] migração concluída com sucesso')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[migrate-storage-to-db] falhou:', error.message)
    process.exit(1)
  })
