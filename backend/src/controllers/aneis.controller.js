const sharepointDataRepository = require('../repositories/sharepoint-data.repository')

function normalizeWhitespace(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sortItems(items = []) {
  return items.slice().sort((left, right) => {
    const leftValue = normalizeWhitespace(left.NumeroAnel)
    const rightValue = normalizeWhitespace(right.NumeroAnel)
    return leftValue.localeCompare(rightValue, 'pt-BR', { numeric: true })
  })
}

function normalizePayload(body = {}) {
  return {
    NumeroAnel: normalizeWhitespace(body.NumeroAnel),
    Status: normalizeWhitespace(body.Status || 'Disponível') || 'Disponível',
    Cor: normalizeWhitespace(body.Cor),
    Ano: normalizeWhitespace(body.Ano),
    OrgaoRegulador: normalizeWhitespace(body.OrgaoRegulador),
    modoCadastro: normalizeWhitespace(body.modoCadastro || 'unico').toLowerCase(),
    NumeroInicial: normalizeWhitespace(body.NumeroInicial),
    NumeroFinal: normalizeWhitespace(body.NumeroFinal),
  }
}

function splitRingCode(value = '') {
  const match = String(value).match(/^(.*?)(\d+)$/)
  if (!match) return null

  return {
    prefix: match[1] || '',
    number: Number(match[2]),
    width: match[2].length,
  }
}

function buildSequence(startValue, endValue) {
  const start = splitRingCode(startValue)
  const end = splitRingCode(endValue)

  if (!start || !end) {
    return { error: 'Informe números inicial e final válidos para o cadastro em lote.' }
  }

  if (start.prefix !== end.prefix) {
    return { error: 'Os anéis em lote precisam ter o mesmo prefixo.' }
  }

  if (end.number < start.number) {
    return { error: 'O número final deve ser maior ou igual ao número inicial.' }
  }

  const items = []
  for (let current = start.number; current <= end.number; current += 1) {
    items.push(`${start.prefix}${String(current).padStart(start.width, '0')}`)
  }

  return { items }
}

function validatePayload(payload = {}) {
  if (payload.modoCadastro === 'varios') {
    if (!payload.NumeroInicial || !payload.NumeroFinal) {
      return 'Informe o primeiro e o último anel da sequência.'
    }

    const sequence = buildSequence(payload.NumeroInicial, payload.NumeroFinal)
    return sequence.error || ''
  }

  if (!payload.NumeroAnel) {
    return 'Número do anel é obrigatório.'
  }

  return ''
}

function buildNewRing(numeroAnel, payload) {
  const now = new Date().toISOString()
  return {
    ID: String(Date.now() + Math.floor(Math.random() * 1000)),
    NumeroAnel: numeroAnel,
    Status: payload.Status || 'Disponível',
    Cor: payload.Cor,
    Ano: payload.Ano,
    OrgaoRegulador: payload.OrgaoRegulador,
    Created: now,
    Modified: now,
  }
}

async function list(_, res) {
  try {
    const items = await sharepointDataRepository.readCollection('aneis')
    return res.json({ items: sortItems(items) })
  } catch (error) {
    console.error('[aneis/list]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar os anéis.' })
  }
}

async function create(req, res) {
  try {
    const payload = normalizePayload(req.body)
    const validationError = validatePayload(payload)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const items = await sharepointDataRepository.readCollection('aneis')
    const existingNumbers = new Set(items.map((item) => normalizeWhitespace(item.NumeroAnel)))

    const sequence = payload.modoCadastro === 'varios'
      ? buildSequence(payload.NumeroInicial, payload.NumeroFinal).items
      : [payload.NumeroAnel]

    const duplicated = sequence.find((numeroAnel) => existingNumbers.has(numeroAnel))
    if (duplicated) {
      return res.status(409).json({ message: `O anel "${duplicated}" já está cadastrado.` })
    }

    const createdItems = sequence.map((numeroAnel) => buildNewRing(numeroAnel, payload))
    const updatedItems = sortItems([...items, ...createdItems])
    await sharepointDataRepository.writeCollection('aneis', updatedItems)

    return res.status(201).json({
      message: createdItems.length > 1 ? 'Anéis cadastrados com sucesso.' : 'Anel cadastrado com sucesso.',
      item: createdItems[0],
      createdItems,
      items: updatedItems,
    })
  } catch (error) {
    console.error('[aneis/create]', error.message)
    return res.status(500).json({ message: 'Não foi possível cadastrar o anel.' })
  }
}

async function update(req, res) {
  try {
    const payload = normalizePayload(req.body)
    if (!payload.NumeroAnel) {
      return res.status(400).json({ message: 'Número do anel é obrigatório.' })
    }

    const items = await sharepointDataRepository.readCollection('aneis')
    const current = items.find((item) => String(item.ID) === String(req.params.id))

    if (!current) {
      return res.status(404).json({ message: 'Anel não encontrado.' })
    }

    const conflict = items.some((item) => String(item.ID) !== String(req.params.id) && normalizeWhitespace(item.NumeroAnel) === payload.NumeroAnel)
    if (conflict) {
      return res.status(409).json({ message: 'Já existe um anel com esse número.' })
    }

    const updatedItem = {
      ...current,
      NumeroAnel: payload.NumeroAnel,
      Status: payload.Status || current.Status,
      Cor: payload.Cor,
      Ano: payload.Ano,
      OrgaoRegulador: payload.OrgaoRegulador,
      Modified: new Date().toISOString(),
    }

    const updatedItems = sortItems(items.map((item) => (String(item.ID) === String(req.params.id) ? updatedItem : item)))
    await sharepointDataRepository.writeCollection('aneis', updatedItems)

    return res.json({
      message: 'Anel atualizado com sucesso.',
      item: updatedItem,
      items: updatedItems,
    })
  } catch (error) {
    console.error('[aneis/update]', error.message)
    return res.status(500).json({ message: 'Não foi possível atualizar o anel.' })
  }
}

async function remove(req, res) {
  try {
    const items = await sharepointDataRepository.readCollection('aneis')
    const exists = items.some((item) => String(item.ID) === String(req.params.id))

    if (!exists) {
      return res.status(404).json({ message: 'Anel não encontrado.' })
    }

    const updatedItems = items.filter((item) => String(item.ID) !== String(req.params.id))
    await sharepointDataRepository.writeCollection('aneis', sortItems(updatedItems))

    return res.json({
      message: 'Anel removido com sucesso.',
      items: sortItems(updatedItems),
    })
  } catch (error) {
    console.error('[aneis/remove]', error.message)
    return res.status(500).json({ message: 'Não foi possível remover o anel.' })
  }
}

module.exports = {
  create,
  list,
  remove,
  update,
}
