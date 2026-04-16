const plantelRepository = require('../repositories/plantel.repository')
const sharepointDataRepository = require('../repositories/sharepoint-data.repository')
const { getCriatorioForUser } = require('../services/criatorio.service')
const { normalizeText } = require('../utils/security.utils')
const { checkFreeTierLimit } = require('../utils/free-tier.utils')

const toStorage = (body) => ({
  nome: body.nome,
  status: body.status,
  nomeMae: body.nomeMae,
  nomePai: body.nomePai,
  gaiola: body.gaiola,
  dataNascimento: body.dataNascimento,
  categoriaAve: body.categoriaAve,
  genero: body.genero,
  origem: body.origem,
  registroFOB: body.registroFOB,
  anelEsquerdo: body.anelEsquerdo,
  mutacao: body.mutacao,
  observacao: body.observacao,
})

function isAllowedValue(value, allowed) {
  return !value || allowed.includes(value)
}

function belongsToCriatorio(item, criatorio) {
  return (
    item.criatorioId === criatorio.id ||
    normalizeText(item.origem) === normalizeText(criatorio.NomeCriatorio)
  )
}

async function listAllowedMutationsBySpecies(categoriaAve = '') {
  const normalizedSpecies = normalizeText(categoriaAve)
  if (!normalizedSpecies) return []

  const records = await sharepointDataRepository.readCollection('mutacoes')
  return records
    .filter((item) => normalizeText(item.Especie) === normalizedSpecies)
    .flatMap((item) => [
      item.MutacaoMacho,
      item.MutacaoFemea,
      item.MutacaoFilhoteMacho,
      item.MutacaoFilhoteFemea,
    ])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
}

async function validatePayload(body = {}) {
  const nome = String(body.nome || '').trim()
  const categoriaAve = String(body.categoriaAve || '').trim()
  const genero = String(body.genero || '').trim()
  const status = String(body.status || '').trim()
  const mutacao = String(body.mutacao || '').trim()

  if (!nome || nome.length < 2 || nome.length > 120) {
    return 'Nome deve ter entre 2 e 120 caracteres.'
  }

  if (!categoriaAve || categoriaAve.length > 80) {
    return 'Categoria da ave é obrigatória e deve ter até 80 caracteres.'
  }

  if (!isAllowedValue(genero, ['Macho', 'Femea'])) {
    return 'Gênero inválido.'
  }

  if (!isAllowedValue(status, ['Vivo', 'Filhote', 'Falecimento', 'Vendido', 'Doado'])) {
    return 'Status inválido.'
  }

  if (body.dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(body.dataNascimento)) {
    return 'Data de nascimento deve estar no formato YYYY-MM-DD.'
  }

  if (mutacao) {
    const allowedMutations = await listAllowedMutationsBySpecies(categoriaAve)
    if (!allowedMutations.length) {
      return 'A espécie selecionada não possui mutações cadastradas.'
    }

    if (!allowedMutations.includes(mutacao)) {
      return 'Mutação inválida para a espécie selecionada.'
    }
  }

  return null
}

async function listar(req, res) {
  try {
    const criatorio = await getCriatorioForUser(req.user)
    if (!criatorio) {
      return res.status(403).json({ message: 'Cadastre seu criatório antes de acessar o plantel.' })
    }

    const scopedItems = await plantelRepository.listByCriatorioId(criatorio.id)

    res.json({ items: scopedItems })
  } catch (e) {
    console.error('[plantel/listar]', e.message)
    res.status(500).json({ message: 'Erro ao buscar dados do plantel.' })
  }
}

async function buscarPorId(req, res) {
  try {
    const criatorio = await getCriatorioForUser(req.user)
    if (!criatorio) {
      return res.status(403).json({ message: 'Cadastre seu criatório antes de acessar o plantel.' })
    }

    const item = await plantelRepository.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Ave não encontrada.' })
    }

    if (!belongsToCriatorio(item, criatorio)) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar esta ave.' })
    }

    res.json({ item })
  } catch (e) {
    console.error('[plantel/buscarPorId]', e.message)
    res.status(404).json({ message: 'Ave não encontrada.' })
  }
}

async function criar(req, res) {
  try {
    const criatorio = await getCriatorioForUser(req.user)
    if (!criatorio) {
      return res.status(403).json({ message: 'Cadastre seu criatório antes de criar aves.' })
    }

    const validationError = await validatePayload(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    // Verifica limite do tier gratuito
    const existingBirds = await plantelRepository.listByCriatorioId(criatorio.id)
    const limitCheck = checkFreeTierLimit(req.currentUser, 'aves', (existingBirds || []).length)
    if (limitCheck.blocked) {
      return res.status(402).json({ message: limitCheck.message, access: limitCheck.access, limit: limitCheck.limit })
    }

    const payload = {
      ...toStorage(req.body),
      origem: criatorio.NomeCriatorio,
      criatorioId: criatorio.id,
      userId: req.user.userId,
    }

    const item = await plantelRepository.createAve(payload)
    res.status(201).json({ item })
  } catch (e) {
    console.error('[plantel/criar]', e.message)
    res.status(500).json({ message: 'Erro ao criar ave.' })
  }
}

async function atualizar(req, res) {
  try {
    const criatorio = await getCriatorioForUser(req.user)
    if (!criatorio) {
      return res.status(403).json({ message: 'Cadastre seu criatório antes de atualizar aves.' })
    }

    const current = await plantelRepository.findById(req.params.id)
    if (!current) {
      return res.status(404).json({ message: 'Ave não encontrada.' })
    }

    if (!belongsToCriatorio(current, criatorio)) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esta ave.' })
    }

    const validationError = await validatePayload({
      ...current,
      ...req.body,
    })
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const item = await plantelRepository.updateAve(req.params.id, {
      ...toStorage(req.body),
      origem: criatorio.NomeCriatorio,
    })

    res.json({ item })
  } catch (e) {
    console.error('[plantel/atualizar]', e.message)
    res.status(500).json({ message: 'Erro ao atualizar ave.' })
  }
}

async function remover(req, res) {
  try {
    const criatorio = await getCriatorioForUser(req.user)
    if (!criatorio) {
      return res.status(403).json({ message: 'Cadastre seu criatório antes de remover aves.' })
    }

    const current = await plantelRepository.findById(req.params.id)
    if (!current) {
      return res.status(404).json({ message: 'Ave não encontrada.' })
    }

    if (!belongsToCriatorio(current, criatorio)) {
      return res.status(403).json({ message: 'Você não tem permissão para remover esta ave.' })
    }

    await plantelRepository.deleteAve(req.params.id)
    res.json({ success: true })
  } catch (e) {
    console.error('[plantel/remover]', e.message)
    res.status(500).json({ message: 'Erro ao remover ave.' })
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover }
