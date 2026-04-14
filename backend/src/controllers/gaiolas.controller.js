const sharepointDataRepository = require('../repositories/sharepoint-data.repository')

function normalizeWhitespace(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sortItems(items = []) {
  return items.slice().sort((left, right) => {
    const leftValue = normalizeWhitespace(left.NumeroGaiola)
    const rightValue = normalizeWhitespace(right.NumeroGaiola)
    return leftValue.localeCompare(rightValue, 'pt-BR', { numeric: true })
  })
}

function normalizePayload(body = {}) {
  return {
    NumeroGaiola: normalizeWhitespace(body.NumeroGaiola),
    Status: normalizeWhitespace(body.Status || 'Vazia') || 'Vazia',
    IdAve: normalizeWhitespace(body.IdAve),
  }
}

function validatePayload(payload = {}) {
  if (!payload.NumeroGaiola) {
    return 'Número da gaiola é obrigatório.'
  }

  return ''
}

async function list(_, res) {
  try {
    const items = await sharepointDataRepository.readCollection('gaiolas')
    return res.json({ items: sortItems(items) })
  } catch (error) {
    console.error('[gaiolas/list]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar as gaiolas.' })
  }
}

async function create(req, res) {
  try {
    const payload = normalizePayload(req.body)
    const validationError = validatePayload(payload)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const items = await sharepointDataRepository.readCollection('gaiolas')
    const alreadyExists = items.some((item) => normalizeWhitespace(item.NumeroGaiola) === payload.NumeroGaiola)
    if (alreadyExists) {
      return res.status(409).json({ message: 'Já existe uma gaiola com esse número.' })
    }

    const now = new Date().toISOString()
    const newItem = {
      ID: String(Date.now()),
      ...payload,
      Created: now,
      Modified: now,
    }

    const updatedItems = sortItems([...items, newItem])
    await sharepointDataRepository.writeCollection('gaiolas', updatedItems)

    return res.status(201).json({
      message: 'Gaiola cadastrada com sucesso.',
      item: newItem,
      items: updatedItems,
    })
  } catch (error) {
    console.error('[gaiolas/create]', error.message)
    return res.status(500).json({ message: 'Não foi possível cadastrar a gaiola.' })
  }
}

async function update(req, res) {
  try {
    const payload = normalizePayload(req.body)
    const validationError = validatePayload(payload)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const items = await sharepointDataRepository.readCollection('gaiolas')
    const current = items.find((item) => String(item.ID) === String(req.params.id))

    if (!current) {
      return res.status(404).json({ message: 'Gaiola não encontrada.' })
    }

    const conflict = items.some((item) => String(item.ID) !== String(req.params.id) && normalizeWhitespace(item.NumeroGaiola) === payload.NumeroGaiola)
    if (conflict) {
      return res.status(409).json({ message: 'Já existe uma gaiola com esse número.' })
    }

    const updatedItem = {
      ...current,
      ...payload,
      Modified: new Date().toISOString(),
    }

    const updatedItems = sortItems(items.map((item) => (String(item.ID) === String(req.params.id) ? updatedItem : item)))
    await sharepointDataRepository.writeCollection('gaiolas', updatedItems)

    return res.json({
      message: 'Gaiola atualizada com sucesso.',
      item: updatedItem,
      items: updatedItems,
    })
  } catch (error) {
    console.error('[gaiolas/update]', error.message)
    return res.status(500).json({ message: 'Não foi possível atualizar a gaiola.' })
  }
}

async function remove(req, res) {
  try {
    const items = await sharepointDataRepository.readCollection('gaiolas')
    const exists = items.some((item) => String(item.ID) === String(req.params.id))

    if (!exists) {
      return res.status(404).json({ message: 'Gaiola não encontrada.' })
    }

    const updatedItems = items.filter((item) => String(item.ID) !== String(req.params.id))
    await sharepointDataRepository.writeCollection('gaiolas', sortItems(updatedItems))

    return res.json({
      message: 'Gaiola removida com sucesso.',
      items: sortItems(updatedItems),
    })
  } catch (error) {
    console.error('[gaiolas/remove]', error.message)
    return res.status(500).json({ message: 'Não foi possível remover a gaiola.' })
  }
}

module.exports = {
  create,
  list,
  remove,
  update,
}
