const sharepointDataRepository = require('../repositories/sharepoint-data.repository')

function normalizeWhitespace(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sortItems(items = []) {
  return items.slice().sort((left, right) => {
    const leftSpecies = normalizeWhitespace(left.Especie)
    const rightSpecies = normalizeWhitespace(right.Especie)
    if (leftSpecies !== rightSpecies) {
      return leftSpecies.localeCompare(rightSpecies, 'pt-BR')
    }

    const leftMutation = normalizeWhitespace(left.MutacaoMacho || left.MutacaoFemea || '')
    const rightMutation = normalizeWhitespace(right.MutacaoMacho || right.MutacaoFemea || '')
    return leftMutation.localeCompare(rightMutation, 'pt-BR')
  })
}

function normalizePayload(body = {}) {
  return {
    Especie: normalizeWhitespace(body.Especie),
    MutacaoMacho: normalizeWhitespace(body.MutacaoMacho),
    LegendaMutacaoMacho: normalizeWhitespace(body.LegendaMutacaoMacho),
    MutacaoFemea: normalizeWhitespace(body.MutacaoFemea),
    LegendaMutacaoFemea: normalizeWhitespace(body.LegendaMutacaoFemea),
    MutacaoFilhoteMacho: normalizeWhitespace(body.MutacaoFilhoteMacho),
    LegendaFilhoteMacho: normalizeWhitespace(body.LegendaFilhoteMacho),
    MutacaoFilhoteFemea: normalizeWhitespace(body.MutacaoFilhoteFemea),
    LegendaFilhoteFemea: normalizeWhitespace(body.LegendaFilhoteFemea),
  }
}

function validatePayload(payload = {}) {
  if (!payload.Especie) {
    return 'Espécie é obrigatória.'
  }

  if (!payload.MutacaoMacho && !payload.MutacaoFemea && !payload.MutacaoFilhoteMacho && !payload.MutacaoFilhoteFemea) {
    return 'Informe pelo menos uma mutação para cadastrar.'
  }

  return ''
}

async function list(_, res) {
  try {
    const items = await sharepointDataRepository.readCollection('mutacoes')
    return res.json(sortItems(items))
  } catch (error) {
    console.error('[mutacoes/list]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar as mutações.' })
  }
}

async function create(req, res) {
  try {
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ message: 'O cadastro de mutação é exclusivo da conta master.' })
    }

    const payload = normalizePayload(req.body)
    const validationError = validatePayload(payload)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const items = await sharepointDataRepository.readCollection('mutacoes')
    const now = new Date().toISOString()
    const newItem = {
      ID: String(Date.now()),
      ...payload,
      Created: now,
      Modified: now,
    }

    const updatedItems = sortItems([...items, newItem])
    await sharepointDataRepository.writeCollection('mutacoes', updatedItems)

    return res.status(201).json({
      message: 'Mutação cadastrada com sucesso.',
      item: newItem,
      items: updatedItems,
    })
  } catch (error) {
    console.error('[mutacoes/create]', error.message)
    return res.status(500).json({ message: 'Não foi possível salvar a mutação.' })
  }
}

module.exports = {
  list,
  create,
}
