const sharepointDataRepository = require('../repositories/sharepoint-data.repository')
const plantelRepository = require('../repositories/plantel.repository')
const { getCriatorioForUser } = require('../services/criatorio.service')
const { requireCriatorio, filterByScope, itemBelongsTo } = require('../utils/tenant-scope.utils')

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

function sortFilhotes(items = []) {
  return items.slice().sort((left, right) => {
    const leftDate = toSortableDate(left.DataNascimento)
    const rightDate = toSortableDate(right.DataNascimento)
    return rightDate.localeCompare(leftDate)
  })
}

async function readFilhotes() {
  const items = await sharepointDataRepository.readCollection('filhotes')
  return Array.isArray(items) ? items : []
}

async function writeFilhotes(items) {
  await sharepointDataRepository.writeCollection('filhotes', sortFilhotes(items))
}

function findFilhote(items, id) {
  return items.find((item) => String(item.ID) === String(id))
}

function listActiveFilhotes(items = []) {
  return sortFilhotes(
    items.filter((item) => {
      const status = normalizeWhitespace(item.Status).toLowerCase()
      return status !== 'faleceu' && status !== 'plantel'
    }),
  )
}

function validateTransferPayload(payload = {}) {
  if (!normalizeWhitespace(payload.Nome)) {
    return 'Nome final do filhote é obrigatório.'
  }

  if (!normalizeWhitespace(payload.CategoriaAve)) {
    return 'Espécie é obrigatória.'
  }

  if (!normalizeWhitespace(payload.Genero)) {
    return 'Gênero é obrigatório.'
  }

  if (!normalizeWhitespace(payload.Gaiola)) {
    return 'Gaiola é obrigatória.'
  }

  return ''
}

function resolveCriatorioRegistroFob(criatorio, payloadRegistro) {
  const explicitValue = normalizeWhitespace(payloadRegistro)
  if (explicitValue) return explicitValue

  return normalizeWhitespace(
    criatorio?.RegistroFOB || criatorio?.CTFCriador || '',
  )
}

async function list(req, res) {
  try {
    const scope = await requireCriatorio(req, res)
    if (!scope) return
    const all = await readFilhotes()
    const scoped = filterByScope(all, scope.criatorio, req.user)
    return res.json({ items: listActiveFilhotes(scoped) })
  } catch (error) {
    console.error('[filhotes/list]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar os filhotes.' })
  }
}

async function update(req, res) {
  try {
    const scope = await requireCriatorio(req, res)
    if (!scope) return

    const items = await readFilhotes()
    const filhote = findFilhote(items, req.params.id)

    if (!filhote) {
      return res.status(404).json({ message: 'Filhote não encontrado.' })
    }
    if (!itemBelongsTo(filhote, scope.criatorio, req.user)) {
      return res.status(403).json({ message: 'Você não tem permissão para alterar este filhote.' })
    }

    const updatedItem = {
      ...filhote,
      NomeAve: normalizeWhitespace(req.body.NomeAve || filhote.NomeAve),
      Status: normalizeWhitespace(req.body.Status || filhote.Status || 'Vivo'),
      Modified: new Date().toISOString(),
    }

    const updatedItems = items.map((item) => (String(item.ID) === String(req.params.id) ? updatedItem : item))
    await writeFilhotes(updatedItems)

    return res.json({
      message: 'Filhote atualizado com sucesso.',
      item: updatedItem,
      items: sortFilhotes(filterByScope(updatedItems, scope.criatorio, req.user)),
    })
  } catch (error) {
    console.error('[filhotes/update]', error.message)
    return res.status(500).json({ message: 'Não foi possível atualizar o filhote.' })
  }
}

async function markDeath(req, res) {
  try {
    const scope = await requireCriatorio(req, res)
    if (!scope) return

    const items = await readFilhotes()
    const filhote = findFilhote(items, req.params.id)

    if (!filhote) {
      return res.status(404).json({ message: 'Filhote não encontrado.' })
    }
    if (!itemBelongsTo(filhote, scope.criatorio, req.user)) {
      return res.status(403).json({ message: 'Você não tem permissão para alterar este filhote.' })
    }

    const updatedItem = {
      ...filhote,
      Status: 'Faleceu',
      Modified: new Date().toISOString(),
    }

    const updatedItems = items.map((item) => (String(item.ID) === String(req.params.id) ? updatedItem : item))
    await writeFilhotes(updatedItems)

    return res.json({
      message: 'Óbito do filhote registrado com sucesso.',
      item: updatedItem,
      items: sortFilhotes(updatedItems),
    })
  } catch (error) {
    console.error('[filhotes/markDeath]', error.message)
    return res.status(500).json({ message: 'Não foi possível registrar o óbito do filhote.' })
  }
}

async function transferToPlantel(req, res) {
  try {
    const items = await readFilhotes()
    const filhote = findFilhote(items, req.params.id)

    if (!filhote) {
      return res.status(404).json({ message: 'Filhote não encontrado.' })
    }

    const criatorio = await getCriatorioForUser(req.user)
    if (!criatorio) {
      return res.status(403).json({ message: 'Cadastre seu criatório antes de enviar filhotes ao plantel.' })
    }

    const payload = {
      Nome: normalizeWhitespace(req.body.Nome),
      CategoriaAve: normalizeWhitespace(req.body.CategoriaAve),
      Genero: normalizeWhitespace(req.body.Genero),
      Gaiola: normalizeWhitespace(req.body.Gaiola),
      Mutacao: normalizeWhitespace(req.body.Mutacao),
      AnelEsquerdo: normalizeWhitespace(req.body.AnelEsquerdo),
      RegistroFOB: normalizeWhitespace(req.body.RegistroFOB),
      observacao: normalizeWhitespace(req.body.observacao),
    }

    const validationError = validateTransferPayload(payload)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const registroFob = resolveCriatorioRegistroFob(criatorio, payload.RegistroFOB)

    const plantelItem = await plantelRepository.createAve({
      nome: payload.Nome,
      status: 'Vivo',
      nomeMae: normalizeWhitespace(filhote.NomeMae),
      nomePai: normalizeWhitespace(filhote.NomePai),
      gaiola: payload.Gaiola,
      dataNascimento: toSortableDate(filhote.DataNascimento),
      categoriaAve: payload.CategoriaAve,
      genero: payload.Genero,
      origem: criatorio.NomeCriatorio,
      registroFOB: registroFob,
      anelEsquerdo: payload.AnelEsquerdo,
      mutacao: payload.Mutacao,
      observacao: payload.observacao,
      criatorioId: criatorio.id,
      userId: req.user.userId,
    })

    const updatedFilhote = {
      ...filhote,
      NomeAve: payload.Nome,
      Status: 'Plantel',
      Gaiola: payload.Gaiola,
      CategoriaAve: payload.CategoriaAve,
      Genero: payload.Genero,
      Mutacao: payload.Mutacao,
      AnelEsquerdo: payload.AnelEsquerdo,
      RegistroFOB: registroFob,
      observacao: payload.observacao,
      PlantelId: plantelItem.id,
      Modified: new Date().toISOString(),
    }

    const updatedItems = items.map((item) => (String(item.ID) === String(req.params.id) ? updatedFilhote : item))
    await writeFilhotes(updatedItems)

    return res.json({
      message: 'Filhote enviado ao plantel com sucesso.',
      filhote: updatedFilhote,
      plantelItem,
      items: sortFilhotes(updatedItems),
    })
  } catch (error) {
    console.error('[filhotes/transfer]', error.message)
    return res.status(500).json({ message: 'Não foi possível enviar o filhote ao plantel.' })
  }
}

module.exports = {
  list,
  update,
  markDeath,
  transferToPlantel,
}
