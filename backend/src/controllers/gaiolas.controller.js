const crypto = require('crypto')
const sharepointDataRepository = require('../repositories/sharepoint-data.repository')
const { checkFreeTierLimit } = require('../utils/free-tier.utils')
const { requireCriatorio, stampCriatorio, filterByScope, itemBelongsTo } = require('../utils/tenant-scope.utils')

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
  if (payload.NumeroGaiola.length > 40) {
    return 'Número da gaiola muito longo (máx 40).'
  }
  return ''
}

async function list(req, res) {
  try {
    const scope = await requireCriatorio(req, res)
    if (!scope) return
    const allItems = await sharepointDataRepository.readCollection('gaiolas')
    const scoped = filterByScope(allItems, scope.criatorio, req.user)
    return res.json({ items: sortItems(scoped) })
  } catch (error) {
    console.error('[gaiolas/list]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar as gaiolas.' })
  }
}

async function create(req, res) {
  try {
    const scope = await requireCriatorio(req, res)
    if (!scope) return

    const payload = normalizePayload(req.body)
    const validationError = validatePayload(payload)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const allItems = await sharepointDataRepository.readCollection('gaiolas')
    const scopedItems = filterByScope(allItems, scope.criatorio, req.user)

    const alreadyExists = scopedItems.some(
      (item) => normalizeWhitespace(item.NumeroGaiola) === payload.NumeroGaiola
    )
    if (alreadyExists) {
      return res.status(409).json({ message: 'Já existe uma gaiola com esse número.' })
    }

    // Verifica limite do tier gratuito (conta apenas as do criatório)
    const limitCheck = checkFreeTierLimit(req.currentUser, 'gaiolas', scopedItems.length)
    if (limitCheck.blocked) {
      return res.status(402).json({ message: limitCheck.message, access: limitCheck.access, limit: limitCheck.limit })
    }

    const now = new Date().toISOString()
    const newItem = stampCriatorio(
      {
        ID: crypto.randomUUID(),
        ...payload,
        Created: now,
        Modified: now,
      },
      scope.criatorio,
      req.user
    )

    const updatedItems = [...allItems, newItem]
    await sharepointDataRepository.writeCollection('gaiolas', sortItems(updatedItems))

    return res.status(201).json({
      message: 'Gaiola cadastrada com sucesso.',
      item: newItem,
      items: sortItems(filterByScope(updatedItems, scope.criatorio, req.user)),
    })
  } catch (error) {
    console.error('[gaiolas/create]', error.message)
    return res.status(500).json({ message: 'Não foi possível cadastrar a gaiola.' })
  }
}

async function update(req, res) {
  try {
    const scope = await requireCriatorio(req, res)
    if (!scope) return

    const payload = normalizePayload(req.body)
    const validationError = validatePayload(payload)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const allItems = await sharepointDataRepository.readCollection('gaiolas')
    const current = allItems.find((item) => String(item.ID) === String(req.params.id))

    if (!current) {
      return res.status(404).json({ message: 'Gaiola não encontrada.' })
    }

    if (!itemBelongsTo(current, scope.criatorio, req.user)) {
      return res.status(403).json({ message: 'Você não tem permissão para alterar esta gaiola.' })
    }

    const scopedItems = filterByScope(allItems, scope.criatorio, req.user)
    const conflict = scopedItems.some(
      (item) => String(item.ID) !== String(req.params.id) && normalizeWhitespace(item.NumeroGaiola) === payload.NumeroGaiola
    )
    if (conflict) {
      return res.status(409).json({ message: 'Já existe uma gaiola com esse número.' })
    }

    const updatedItem = {
      ...current,
      ...payload,
      Modified: new Date().toISOString(),
    }

    const updatedItems = allItems.map((item) => (String(item.ID) === String(req.params.id) ? updatedItem : item))
    await sharepointDataRepository.writeCollection('gaiolas', sortItems(updatedItems))

    return res.json({
      message: 'Gaiola atualizada com sucesso.',
      item: updatedItem,
      items: sortItems(filterByScope(updatedItems, scope.criatorio, req.user)),
    })
  } catch (error) {
    console.error('[gaiolas/update]', error.message)
    return res.status(500).json({ message: 'Não foi possível atualizar a gaiola.' })
  }
}

async function remove(req, res) {
  try {
    const scope = await requireCriatorio(req, res)
    if (!scope) return

    const allItems = await sharepointDataRepository.readCollection('gaiolas')
    const current = allItems.find((item) => String(item.ID) === String(req.params.id))

    if (!current) {
      return res.status(404).json({ message: 'Gaiola não encontrada.' })
    }

    if (!itemBelongsTo(current, scope.criatorio, req.user)) {
      return res.status(403).json({ message: 'Você não tem permissão para remover esta gaiola.' })
    }

    const updatedItems = allItems.filter((item) => String(item.ID) !== String(req.params.id))
    await sharepointDataRepository.writeCollection('gaiolas', sortItems(updatedItems))

    return res.json({
      message: 'Gaiola removida com sucesso.',
      items: sortItems(filterByScope(updatedItems, scope.criatorio, req.user)),
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
