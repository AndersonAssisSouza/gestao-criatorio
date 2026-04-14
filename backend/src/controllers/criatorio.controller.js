const criatorioRepository = require('../repositories/criatorio.repository')
const {
  belongsToUser,
  fromStorage,
  getCriatorioForUser,
  listCriatoriosForUser,
  toSP,
} = require('../services/criatorio.service')

function validatePayload(payload = {}) {
  const nome = String(payload.NomeCriatorio || '').trim()
  const responsavel = String(payload.Responsavel || '').trim()
  const ctf = String(payload.CTFCriador || '').trim()
  const endereco = String(payload.Endereco || '').trim()
  const telefone = String(payload.Telefone || '').trim()

  if (!nome || nome.length < 3 || nome.length > 120) {
    return 'Nome do criatório deve ter entre 3 e 120 caracteres.'
  }

  if (!responsavel || responsavel.length < 3 || responsavel.length > 120) {
    return 'Responsável deve ter entre 3 e 120 caracteres.'
  }

  if (ctf.length > 40 || endereco.length > 160 || telefone.length > 40) {
    return 'Um ou mais campos excedem o limite permitido.'
  }

  return null
}

async function listarMeuCriatorio(req, res) {
  try {
    const criatorios = await listCriatoriosForUser(req.user)
    return res.json({ items: criatorios, item: criatorios[0] || null })
  } catch (error) {
    console.error('[criatorios/listar]', error.message)
    return res.status(500).json({ message: 'Erro ao buscar o criatório.' })
  }
}

async function criarMeuCriatorio(req, res) {
  try {
    const validationError = validatePayload(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const existing = await getCriatorioForUser(req.user)
    if (existing) {
      return res.status(409).json({ message: 'Cada usuário pode ter apenas um criatório.' })
    }

    const item = await criatorioRepository.createCriatorio({
      ...toSP(req.body, req.user),
      userId: req.user.userId,
    })

    return res.status(201).json({ item: fromStorage(item) })
  } catch (error) {
    console.error('[criatorios/criar]', error.message)

    if (error.code === 'USER_ALREADY_HAS_CRIATORIO') {
      return res.status(409).json({ message: 'Cada usuário pode ter apenas um criatório.' })
    }

    return res.status(500).json({ message: 'Erro ao criar criatório.' })
  }
}

async function atualizarMeuCriatorio(req, res) {
  try {
    const validationError = validatePayload(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const current = await criatorioRepository.findById(req.params.id)
    if (!current) {
      return res.status(404).json({ message: 'Criatório não encontrado.' })
    }

    const mapped = fromStorage(current)
    if (!belongsToUser(mapped, req.user)) {
      return res.status(403).json({ message: 'Você não tem permissão para editar este criatório.' })
    }

    const updated = await criatorioRepository.updateCriatorio(req.params.id, {
      ...toSP(req.body, req.user),
    })

    return res.json({ item: fromStorage(updated) })
  } catch (error) {
    console.error('[criatorios/atualizar]', error.message)
    return res.status(500).json({ message: 'Erro ao atualizar criatório.' })
  }
}

async function removerMeuCriatorio(req, res) {
  try {
    const current = await criatorioRepository.findById(req.params.id)
    if (!current) {
      return res.status(404).json({ message: 'Criatório não encontrado.' })
    }

    const mapped = fromStorage(current)
    if (!belongsToUser(mapped, req.user)) {
      return res.status(403).json({ message: 'Você não tem permissão para remover este criatório.' })
    }

    await criatorioRepository.deleteCriatorio(req.params.id)
    return res.json({ success: true })
  } catch (error) {
    console.error('[criatorios/remover]', error.message)
    return res.status(500).json({ message: 'Erro ao remover criatório.' })
  }
}

module.exports = {
  atualizarMeuCriatorio,
  criarMeuCriatorio,
  listarMeuCriatorio,
  removerMeuCriatorio,
}
