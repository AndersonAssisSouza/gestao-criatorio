const crypto = require('crypto')
const sharepointDataRepository = require('../repositories/sharepoint-data.repository')
const { checkFreeTierLimit } = require('../utils/free-tier.utils')

function normalizeWhitespace(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toSortableDate(value = '') {
  const text = normalizeWhitespace(value)
  if (!text) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''

  return `${match[3]}-${match[2]}-${match[1]}`
}

function parseEggSequence(numeroOvo = '') {
  const text = normalizeWhitespace(numeroOvo)
  if (!text) return Number.NaN

  const direct = Number.parseInt(text, 10)
  if (!Number.isNaN(direct)) return direct

  const match = text.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : Number.NaN
}

function getEggSortValue(egg = {}) {
  return (
    toSortableDate(egg.DataPostura) ||
    toSortableDate(egg.DataNascimento) ||
    toSortableDate(egg.DataDescarte) ||
    String(egg.Created || '')
  )
}

function sortEggs(items = []) {
  return items.slice().sort((left, right) => {
    const cageCompare = normalizeWhitespace(left.Gaiola).localeCompare(normalizeWhitespace(right.Gaiola), 'pt-BR')
    if (cageCompare !== 0) return cageCompare

    const clutchCompare = Number(left.NinhadaNumero || 0) - Number(right.NinhadaNumero || 0)
    if (clutchCompare !== 0) return clutchCompare

    const leftSequence = parseEggSequence(left.NumeroOvo)
    const rightSequence = parseEggSequence(right.NumeroOvo)
    if (!Number.isNaN(leftSequence) && !Number.isNaN(rightSequence) && leftSequence !== rightSequence) {
      return leftSequence - rightSequence
    }

    return getEggSortValue(left).localeCompare(getEggSortValue(right))
  })
}

function sortClutches(items = []) {
  return items.slice().sort((left, right) => {
    const cageCompare = normalizeWhitespace(left.Gaiola).localeCompare(normalizeWhitespace(right.Gaiola), 'pt-BR')
    if (cageCompare !== 0) return cageCompare
    return Number(right.Numero || 0) - Number(left.Numero || 0)
  })
}

async function readEggs() {
  const items = await sharepointDataRepository.readCollection('ovos')
  return Array.isArray(items) ? items : []
}

async function writeEggs(items) {
  await sharepointDataRepository.writeCollection('ovos', sortEggs(items))
}

async function readClutches() {
  const items = await sharepointDataRepository.readCollection('ninhadas')
  return Array.isArray(items) ? items : []
}

async function writeClutches(items) {
  await sharepointDataRepository.writeCollection('ninhadas', sortClutches(items))
}

function buildClutchForImportedGroup({ cage, number, eggs }) {
  const lastEgg = eggs[eggs.length - 1] || {}
  const hasOpenEgg = eggs.some((egg) => !['Nasceu', 'Descartado'].includes(normalizeWhitespace(egg.Status)))

  return {
    id: crypto.randomUUID(),
    Gaiola: cage,
    Numero: number,
    Status: hasOpenEgg ? 'Ativa' : 'Finalizada',
    NomeMae: normalizeWhitespace(lastEgg.NomeMae),
    NomePai: normalizeWhitespace(lastEgg.NomePai),
    Created: getEggSortValue(eggs[0]),
    Modified: new Date().toISOString(),
    EncerradaEm: hasOpenEgg ? '' : (getEggSortValue(lastEgg) || ''),
  }
}

async function ensureClutches(eggs, existingClutches) {
  const hasMissingLinks = eggs.some((egg) => !normalizeWhitespace(egg.NinhadaId))
  if (existingClutches.length > 0 && !hasMissingLinks) {
    return { eggs, clutches: existingClutches, changed: false }
  }

  const groupedByCage = eggs.reduce((accumulator, egg) => {
    const cage = normalizeWhitespace(egg.Gaiola)
    if (!cage) return accumulator
    accumulator[cage] = accumulator[cage] || []
    accumulator[cage].push(egg)
    return accumulator
  }, {})

  const nextClutches = []
  const linkedEggs = []

  Object.entries(groupedByCage).forEach(([cage, cageEggs]) => {
    const orderedEggs = cageEggs.slice().sort((left, right) => getEggSortValue(left).localeCompare(getEggSortValue(right)))
    let clutchNumber = 1
    let previousSequence = Number.NaN
    let clutchEggs = []

    const flushClutch = () => {
      if (clutchEggs.length === 0) return
      const clutch = buildClutchForImportedGroup({ cage, number: clutchNumber, eggs: clutchEggs })
      nextClutches.push(clutch)
      clutchEggs.forEach((egg) => {
        linkedEggs.push({
          ...egg,
          NinhadaId: clutch.id,
          NinhadaNumero: clutch.Numero,
        })
      })
      clutchNumber += 1
      clutchEggs = []
    }

    orderedEggs.forEach((egg, index) => {
      const sequence = parseEggSequence(egg.NumeroOvo)
      const shouldStartNewClutch = index > 0 && !Number.isNaN(sequence) && !Number.isNaN(previousSequence) && sequence <= previousSequence
      if (shouldStartNewClutch) {
        flushClutch()
      }

      clutchEggs.push(egg)
      previousSequence = sequence
    })

    flushClutch()
  })

  const alreadyLinkedEggs = eggs.filter((egg) => normalizeWhitespace(egg.NinhadaId))
  const mergedEggs = sortEggs([...alreadyLinkedEggs, ...linkedEggs])

  await writeClutches(nextClutches)
  await writeEggs(mergedEggs)

  return {
    eggs: mergedEggs,
    clutches: nextClutches,
    changed: true,
  }
}

async function loadDataset() {
  const [rawEggs, rawClutches] = await Promise.all([readEggs(), readClutches()])
  const ensured = await ensureClutches(rawEggs, rawClutches)
  return {
    eggs: ensured.eggs,
    clutches: ensured.clutches,
  }
}

function getActiveClutchForCage(clutches, cage) {
  return clutches.find((clutch) => normalizeWhitespace(clutch.Gaiola) === normalizeWhitespace(cage) && clutch.Status === 'Ativa') || null
}

function getNextClutchNumber(clutches, cage) {
  const cageClutches = clutches.filter((clutch) => normalizeWhitespace(clutch.Gaiola) === normalizeWhitespace(cage))
  return cageClutches.length === 0 ? 1 : Math.max(...cageClutches.map((clutch) => Number(clutch.Numero || 0))) + 1
}

function validateRestartPayload(body = {}) {
  if (!normalizeWhitespace(body.Gaiola)) {
    return 'Gaiola é obrigatória para reiniciar a ninhada.'
  }
  return ''
}

function validateCreateEggPayload(body = {}) {
  if (!normalizeWhitespace(body.Gaiola)) {
    return 'Gaiola é obrigatória para cadastrar um ovo.'
  }
  return ''
}

function findEgg(eggs, id) {
  return eggs.find((egg) => String(egg.ID) === String(id))
}

async function list(_, res) {
  try {
    const dataset = await loadDataset()
    return res.json({
      items: sortEggs(dataset.eggs),
      ninhadas: sortClutches(dataset.clutches),
    })
  } catch (error) {
    console.error('[ovos/list]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar os ovos.' })
  }
}

async function restartClutch(req, res) {
  try {
    const validationError = validateRestartPayload(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const cage = normalizeWhitespace(req.body.Gaiola)
    const dataset = await loadDataset()
    const now = new Date().toISOString()

    // Verifica limite do tier gratuito (ninhadas ativas)
    const activeClutchesCount = (dataset.clutches || []).filter((c) => c.Status === 'Ativa').length
    const limitCheck = checkFreeTierLimit(req.currentUser, 'ninhadas', activeClutchesCount)
    if (limitCheck.blocked) {
      return res.status(402).json({ message: limitCheck.message, access: limitCheck.access, limit: limitCheck.limit })
    }

    const nextClutches = dataset.clutches.map((clutch) => {
      if (normalizeWhitespace(clutch.Gaiola) !== cage || clutch.Status !== 'Ativa') {
        return clutch
      }

      return {
        ...clutch,
        Status: 'Finalizada',
        EncerradaEm: now,
        Modified: now,
      }
    })

    const newClutch = {
      id: crypto.randomUUID(),
      Gaiola: cage,
      Numero: getNextClutchNumber(dataset.clutches, cage),
      Status: 'Ativa',
      NomeMae: normalizeWhitespace(req.body.NomeMae),
      NomePai: normalizeWhitespace(req.body.NomePai),
      Created: now,
      Modified: now,
      EncerradaEm: '',
    }

    const updatedClutches = sortClutches([...nextClutches, newClutch])
    await writeClutches(updatedClutches)

    return res.status(201).json({
      message: 'Nova ninhada iniciada com sucesso.',
      ninhada: newClutch,
      ninhadas: updatedClutches,
      items: sortEggs(dataset.eggs),
    })
  } catch (error) {
    console.error('[ovos/restartClutch]', error.message)
    return res.status(500).json({ message: 'Não foi possível reiniciar a ninhada.' })
  }
}

async function create(req, res) {
  try {
    const validationError = validateCreateEggPayload(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const cage = normalizeWhitespace(req.body.Gaiola)
    const dataset = await loadDataset()
    let activeClutch = getActiveClutchForCage(dataset.clutches, cage)
    let updatedClutches = dataset.clutches.slice()
    const now = new Date().toISOString()

    if (!activeClutch) {
      // Verifica limite do tier gratuito antes de criar nova ninhada
      const activeClutchesCount = (dataset.clutches || []).filter((c) => c.Status === 'Ativa').length
      const limitCheck = checkFreeTierLimit(req.currentUser, 'ninhadas', activeClutchesCount)
      if (limitCheck.blocked) {
        return res.status(402).json({ message: limitCheck.message, access: limitCheck.access, limit: limitCheck.limit })
      }

      activeClutch = {
        id: crypto.randomUUID(),
        Gaiola: cage,
        Numero: getNextClutchNumber(dataset.clutches, cage),
        Status: 'Ativa',
        NomeMae: normalizeWhitespace(req.body.NomeMae),
        NomePai: normalizeWhitespace(req.body.NomePai),
        Created: now,
        Modified: now,
        EncerradaEm: '',
      }
      updatedClutches = sortClutches([...updatedClutches, activeClutch])
      await writeClutches(updatedClutches)
    }

    const eggsInClutch = dataset.eggs.filter((egg) => normalizeWhitespace(egg.NinhadaId) === activeClutch.id)
    const nextSequence = eggsInClutch.length + 1
    const egg = {
      ID: String(Date.now()),
      NumeroOvo: String(nextSequence),
      Gaiola: cage,
      Status: 'Postura',
      NomeMae: normalizeWhitespace(req.body.NomeMae || activeClutch.NomeMae),
      NomePai: normalizeWhitespace(req.body.NomePai || activeClutch.NomePai),
      DataPostura: normalizeWhitespace(req.body.DataPostura || now.split('T')[0]),
      DataInicioChoco: '',
      ConfirmaInicioChoco: '',
      DataPrevistaNascimento: '',
      DataNascimento: '',
      DataConfirmacaoFetilizacao: '',
      DataDescarte: '',
      NinhadaId: activeClutch.id,
      NinhadaNumero: activeClutch.Numero,
      Created: now,
      Modified: now,
    }

    const updatedEggs = sortEggs([...dataset.eggs, egg])
    await writeEggs(updatedEggs)

    return res.status(201).json({
      message: 'Ovo adicionado com sucesso.',
      item: egg,
      items: updatedEggs,
      ninhadas: updatedClutches,
    })
  } catch (error) {
    console.error('[ovos/create]', error.message)
    return res.status(500).json({ message: 'Não foi possível cadastrar o ovo.' })
  }
}

async function updateStatus(req, res) {
  try {
    const dataset = await loadDataset()
    const egg = findEgg(dataset.eggs, req.params.id)

    if (!egg) {
      return res.status(404).json({ message: 'Ovo não encontrado.' })
    }

    const nextStatus = normalizeWhitespace(req.body.Status)
    const actionDate = normalizeWhitespace(req.body.ActionDate)
    const updatedEggs = dataset.eggs.map((item) => {
      if (String(item.ID) !== String(req.params.id)) return item

      const updated = {
        ...item,
        Status: nextStatus || item.Status,
        Modified: new Date().toISOString(),
      }

      if (nextStatus === 'Chocando') {
        updated.DataInicioChoco = actionDate
        updated.ConfirmaInicioChoco = 'Sim'
        updated.DataPrevistaNascimento = normalizeWhitespace(req.body.DataPrevistaNascimento)
      }

      if (nextStatus === 'Fertilizado') {
        updated.DataConfirmacaoFetilizacao = actionDate
      }

      if (nextStatus === 'Nasceu') {
        updated.DataNascimento = actionDate
      }

      if (nextStatus === 'Descartado') {
        updated.DataDescarte = actionDate
      }

      return updated
    })

    await writeEggs(updatedEggs)

    return res.json({
      message: 'Ovo atualizado com sucesso.',
      item: updatedEggs.find((item) => String(item.ID) === String(req.params.id)),
      items: updatedEggs,
      ninhadas: dataset.clutches,
    })
  } catch (error) {
    console.error('[ovos/updateStatus]', error.message)
    return res.status(500).json({ message: 'Não foi possível atualizar o ovo.' })
  }
}

module.exports = {
  create,
  list,
  restartClutch,
  updateStatus,
}
