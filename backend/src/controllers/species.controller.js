const sharepointDataRepository = require('../repositories/sharepoint-data.repository')
const { enrichSpecies } = require('../services/species-enrichment.service')

function normalizeWhitespace(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeSpeciesPayload(payload = {}) {
  return {
    Especie: normalizeWhitespace(payload.Especie),
    NomeCientifico: normalizeWhitespace(payload.NomeCientifico),
    Origem: normalizeWhitespace(payload.Origem),
    Comentarios: normalizeWhitespace(payload.Comentarios),
    PeriodoReproducao: normalizeWhitespace(payload.PeriodoReproducao),
    TempoChoco: Number(payload.TempoChoco) || 0,
  }
}

function validateSpeciesPayload(payload = {}) {
  if (!payload.Especie) {
    return 'Espécie é obrigatória.'
  }

  if (!payload.NomeCientifico) {
    return 'Nome científico é obrigatório.'
  }

  return ''
}

function sortSpecies(items = []) {
  return items.slice().sort((left, right) => left.Especie.localeCompare(right.Especie, 'pt-BR'))
}

async function list(_, res) {
  try {
    const species = await sharepointDataRepository.readCollection('especies')
    return res.json(sortSpecies(species))
  } catch (error) {
    console.error('[species/list]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar as espécies.' })
  }
}

async function create(req, res) {
  try {
    const payload = normalizeSpeciesPayload(req.body)
    const validationError = validateSpeciesPayload(payload)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const species = await sharepointDataRepository.readCollection('especies')
    const now = new Date().toISOString()
    const newRecord = {
      ID: String(Date.now()),
      ...payload,
      Created: now,
      Modified: now,
    }

    const updatedSpecies = sortSpecies([...species, newRecord])
    await sharepointDataRepository.writeCollection('especies', updatedSpecies)

    return res.status(201).json({
      message: 'Espécie cadastrada com sucesso.',
      item: newRecord,
      items: updatedSpecies,
    })
  } catch (error) {
    console.error('[species/create]', error.message)
    return res.status(500).json({ message: 'Não foi possível salvar a espécie.' })
  }
}

async function update(req, res) {
  try {
    const speciesId = String(req.params.id || '').trim()
    const payload = normalizeSpeciesPayload(req.body)
    const validationError = validateSpeciesPayload(payload)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const species = await sharepointDataRepository.readCollection('especies')
    const currentItem = species.find((item) => String(item.ID) === speciesId)

    if (!currentItem) {
      return res.status(404).json({ message: 'Espécie não encontrada.' })
    }

    const updatedItem = {
      ...currentItem,
      ...payload,
      Modified: new Date().toISOString(),
    }

    const updatedSpecies = sortSpecies(
      species.map((item) => (String(item.ID) === speciesId ? updatedItem : item))
    )

    await sharepointDataRepository.writeCollection('especies', updatedSpecies)

    return res.json({
      message: 'Espécie atualizada com sucesso.',
      item: updatedItem,
      items: updatedSpecies,
    })
  } catch (error) {
    console.error('[species/update]', error.message)
    return res.status(500).json({ message: 'Não foi possível atualizar a espécie.' })
  }
}

async function remove(req, res) {
  try {
    const speciesId = String(req.params.id || '').trim()
    const species = await sharepointDataRepository.readCollection('especies')
    const exists = species.some((item) => String(item.ID) === speciesId)

    if (!exists) {
      return res.status(404).json({ message: 'Espécie não encontrada.' })
    }

    const updatedSpecies = species.filter((item) => String(item.ID) !== speciesId)
    await sharepointDataRepository.writeCollection('especies', updatedSpecies)

    return res.json({
      message: 'Espécie removida com sucesso.',
      items: sortSpecies(updatedSpecies),
    })
  } catch (error) {
    console.error('[species/remove]', error.message)
    return res.status(500).json({ message: 'Não foi possível remover a espécie.' })
  }
}

async function lookup(req, res) {
  try {
    const query = String(req.query?.q || '').trim()
    const result = await enrichSpecies(query)

    return res.json({
      message: 'Dados complementares encontrados para a espécie informada.',
      ...result,
    })
  } catch (error) {
    console.error('[species/lookup]', error.message)

    if (error.code === 'INVALID_QUERY') {
      return res.status(400).json({ message: error.message })
    }

    if (error.code === 'SPECIES_NOT_FOUND') {
      return res.status(404).json({ message: error.message })
    }

    return res.status(502).json({
      message: 'Não foi possível complementar a espécie pela internet agora.',
    })
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
  lookup,
}
