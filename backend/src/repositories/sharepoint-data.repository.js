const path = require('path')
const storageEngine = require('./storage.engine')

const DEFAULT_STORAGE_DIR = storageEngine.DEFAULT_STORAGE_DIR

const FILES = {
  aneis: 'aneis.json',
  gaiolas: 'gaiolas.json',
  filhotes: 'filhotes.json',
  especies: 'especies.json',
  financeiro: 'financeiro.json',
  mutacoes: 'mutacoes.json',
  ninhadas: 'ninhadas.json',
  listaItens: 'lista-itens.json',
  ovos: 'ovos.json',
}

function getFilePath(collectionName) {
  const fileName = FILES[collectionName]

  if (!fileName) {
    throw new Error(`Coleção SharePoint não suportada: ${collectionName}`)
  }

  return path.join(DEFAULT_STORAGE_DIR, fileName)
}

async function writeCollection(collectionName, items) {
  const filePath = getFilePath(collectionName)
  return storageEngine.writeCollection(collectionName, items, filePath)
}

async function readCollection(collectionName) {
  const filePath = getFilePath(collectionName)
  return storageEngine.readCollection(collectionName, filePath)
}

module.exports = {
  FILES,
  readCollection,
  writeCollection,
}
