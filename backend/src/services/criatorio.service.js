const criatorioRepository = require('../repositories/criatorio.repository')
const { buildAccessKeys, normalizeText } = require('../utils/security.utils')

function fromStorage(item) {
  return {
    id: item.id,
    NomeCriatorio: item.NomeCriatorio || '',
    Responsavel: item.Responsavel || '',
    CTFCriador: item.CTFCriador || '',
    Endereco: item.Endereco || '',
    Acesso: item.Acesso || '',
    Telefone: item.Telefone || '',
  }
}

function toSP(payload, user) {
  return {
    NomeCriatorio: payload.NomeCriatorio,
    Responsavel: payload.Responsavel,
    CTFCriador: payload.CTFCriador || '',
    Endereco: payload.Endereco || '',
    Acesso: user.email,
    Telefone: payload.Telefone || '',
  }
}

function belongsToUser(criatorio, user) {
  const criatorioAccess = normalizeText(criatorio.Acesso)
  const userKeys = buildAccessKeys(user)
  return userKeys.some((key) => normalizeText(key) === criatorioAccess)
}

async function listCriatoriosForUser(user) {
  const items = await criatorioRepository.findByUserId(user.userId)

  if (items.length > 0) {
    return items.map(fromStorage).filter((item) => belongsToUser(item, user))
  }

  const legacyItems = await criatorioRepository.findByAccess(user.email)
  return legacyItems.map(fromStorage).filter((item) => belongsToUser(item, user))
}

async function getCriatorioForUser(user) {
  const items = await listCriatoriosForUser(user)
  return items[0] || null
}

module.exports = {
  belongsToUser,
  fromStorage,
  getCriatorioForUser,
  listCriatoriosForUser,
  toSP,
}
