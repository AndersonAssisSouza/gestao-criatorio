const sharepointService = require('./sharepoint.service')
const criatorioRepository = require('../repositories/criatorio.repository')
const plantelRepository = require('../repositories/plantel.repository')
const sharepointDataRepository = require('../repositories/sharepoint-data.repository')
const { buildAccessKeys, normalizeText } = require('../utils/security.utils')

function pick(...values) {
  return values.find((value) => String(value || '').trim()) || ''
}

function belongsToUserByAccess(value, user) {
  const normalized = normalizeText(value)
  if (!normalized) return false

  return buildAccessKeys(user).some((key) => normalizeText(key) === normalized)
}

function mapCriatorioFromSharePoint(item) {
  return {
    sharepointItemId: item.id,
    NomeCriatorio: pick(item.NomeCriatorio, item.Title),
    Responsavel: pick(item.Responsavel, item['Respons_x00e1_vel'], item.Author?.DisplayName),
    CTFCriador: pick(item.CTFCriador),
    Endereco: pick(item.Endereco),
    Acesso: pick(item.Acesso, item.Email),
    Telefone: pick(item.Telefone),
  }
}

function parseBrazilianNumber(value) {
  const normalized = String(value || '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapAveFromSharePoint(item, criatorio, user) {
  return {
    sharepointItemId: item.id,
    nome: pick(item.Nome, item.Title),
    status: pick(item.Status, 'Vivo'),
    nomeMae: pick(item.NomeMae),
    nomePai: pick(item.NomePai),
    gaiola: pick(item.Gaiola),
    dataNascimento: pick(item.DataNascimento),
    categoriaAve: pick(item.CategoriaAve),
    genero: pick(item.Genero),
    origem: pick(item.Origem, criatorio.NomeCriatorio),
    registroFOB: pick(item.RegistroFOB),
    anelEsquerdo: pick(item.AnelEsquerdo),
    mutacao: pick(item.Mutacao),
    observacao: pick(item.observacao, item.Observacao),
    criatorioId: criatorio.id,
    userId: user.userId,
  }
}

function mapAnelFromSharePoint(item) {
  return {
    ID: item.id,
    NumeroAnel: pick(item.NumeroAnel, item.Title),
    Status: pick(item.Status),
    Cor: pick(item.Cor),
    Ano: pick(item.Ano),
    OrgaoRegulador: pick(item.OrgaoRegulador),
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function mapGaiolaFromSharePoint(item) {
  return {
    ID: item.id,
    NumeroGaiola: pick(item.NumeroGaiola, item.Title),
    Status: pick(item.Status),
    IdAve: pick(item.IdAve),
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function mapOvoFromSharePoint(item) {
  return {
    ID: item.id,
    NumeroOvo: pick(item.NumeroOvo, item.Title),
    Gaiola: pick(item.Gaiola),
    Status: pick(item.Status),
    NomeMae: pick(item.NomeMae),
    NomePai: pick(item.NomePai),
    DataPostura: pick(item.DataPostura),
    DataInicioChoco: pick(item.DataInicioChoco),
    DataPrevistaNascimento: pick(item.DataPrevistaNascimento),
    DataNascimento: pick(item.DataNascimento),
    DataOvoscopia: pick(item.DataOvoscopia),
    ConfirmaInicioChoco: pick(item.ConfirmaInicioChoco),
    DataConfirmacaoFetilizacao: pick(item.DataConfirmacaoFetilizacao),
    DataDescarte: pick(item.DataDescarte),
    IDGaiola: pick(item.IDGaiolaLookupId),
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function mapFilhoteFromSharePoint(item, plantelBySharepointId = {}) {
  const mae = plantelBySharepointId[String(item['M_x00e3_eLookupId'] || '')]
  const pai = plantelBySharepointId[String(item.IDPaiLookupId || '')]

  return {
    ID: item.id,
    NomeAve: pick(item.NomeAve, item.Title),
    NumeroOvo: pick(item.NumeroOvo),
    Status: pick(item.Status, 'Vivo'),
    DataNascimento: pick(item.DataNascimento),
    DataPrevistaAnilhamento: pick(item.DataPrevistaAnilhamento),
    Gaiola: pick(item.Gaiola),
    IDMae: pick(item['M_x00e3_eLookupId']),
    IDPai: pick(item.IDPaiLookupId),
    NomeMae: pick(mae?.nome, item.NomeMae),
    MutacaoMae: pick(mae?.mutacao, item.MutacaoMae),
    NomePai: pick(pai?.nome, item.NomePai),
    MutacaoPai: pick(pai?.mutacao, item.MutacaoPai),
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function mapEspecieFromSharePoint(item) {
  return {
    ID: item.id,
    Especie: pick(item.Especie, item.Title),
    NomeCientifico: pick(item.NomeCientifico, item['NomeCient_x00ed_fico']),
    Origem: pick(item.Origem),
    Comentarios: pick(item.Comentarios),
    PeriodoReproducao: pick(item.PeriodoReproducao),
    TempoChoco: Number(pick(item.TempoChoco)) || 0,
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function mapFinanceiroFromSharePoint(item) {
  return {
    ID: item.id,
    Item: pick(item.Item, item.Title),
    TipoMovimentacao: pick(item.TipoMovimentacao),
    Produto: pick(item.Produto),
    Quantidade: Number(pick(item.Quantidade)) || 0,
    Valor: parseBrazilianNumber(item.Valor),
    ValorTotal: parseBrazilianNumber(item.ValorTotal),
    Acesso: pick(item.Acesso),
    Data: pick(item.Data, item.Created).split('T')[0] || '',
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function mapMutacaoFromSharePoint(item) {
  return {
    ID: item.id,
    Especie: pick(item.Especie),
    MutacaoMacho: pick(item.MutacaoMacho),
    LegendaMutacaoMacho: pick(item.LegendaMutacaoMacho),
    MutacaoFemea: pick(item.MutacaoFemea),
    LegendaMutacaoFemea: pick(item.LegendaMutacaoFemea),
    MutacaoFilhoteMacho: pick(item.MutacaoFilhoteMacho),
    LegendaFilhoteMacho: pick(item.LegendaFilhoteMacho),
    MutacaoFilhoteFemea: pick(item.MutacaoFilhoteFemea),
    LegendaFilhoteFemea: pick(item.LegendaFilhoteFemea),
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function mapListaItemFromSharePoint(item) {
  return {
    ID: item.id,
    Item: pick(item.Item, item.Title),
    Created: pick(item.Created),
    Modified: pick(item.Modified),
    sharepointItemId: item.id,
  }
}

function belongsToUser(item, user) {
  return belongsToUserByAccess(item.Acesso, user) || belongsToUserByAccess(item.Email, user)
}

async function importCurrentUserDataFromSharePoint(user) {
  const criatorios = await sharepointService.listarItens('gestaoCriatorio')
  const matchingCriatorio = criatorios
    .map(mapCriatorioFromSharePoint)
    .find((item) => belongsToUserByAccess(item.Acesso, user))

  if (!matchingCriatorio) {
    const error = new Error('Nenhum criatório encontrado no SharePoint para este usuário.')
    error.code = 'CRIATORIO_NOT_FOUND'
    throw error
  }

  const localCriatorio = await criatorioRepository.upsertCriatorioByUserId(user.userId, matchingCriatorio)
  const aves = await sharepointService.listarItens('plantel')
  const importedAves = aves
    .filter((item) => belongsToUser(item, user) || normalizeText(item.Origem) === normalizeText(localCriatorio.NomeCriatorio))
    .map((item) => mapAveFromSharePoint(item, localCriatorio, user))

  const savedAves = await plantelRepository.replaceByCriatorioId(localCriatorio.id, importedAves)

  const plantelBySharepointId = savedAves.reduce((acc, item) => {
    if (item.sharepointItemId) {
      acc[String(item.sharepointItemId)] = item
    }
    return acc
  }, {})

  const aneis = (await sharepointService.listarItens('aneis')).map(mapAnelFromSharePoint)
  const gaiolas = (await sharepointService.listarItens('gaiolas')).map(mapGaiolaFromSharePoint)
  const ovos = (await sharepointService.listarItens('ovos')).map(mapOvoFromSharePoint)
  const filhotes = (await sharepointService.listarItens('filhotes')).map((item) => mapFilhoteFromSharePoint(item, plantelBySharepointId))
  const especies = (await sharepointService.listarItens('especieAve')).map(mapEspecieFromSharePoint)
  const financeiro = (await sharepointService.listarItens('controleFinanceiro'))
    .filter((item) => !pick(item.Acesso) || belongsToUser(item, user))
    .map(mapFinanceiroFromSharePoint)
  const mutacoes = (await sharepointService.listarItens('mutacaoTarin')).map(mapMutacaoFromSharePoint)
  const listaItens = (await sharepointService.listarItens('listaItens')).map(mapListaItemFromSharePoint)

  await Promise.all([
    sharepointDataRepository.writeCollection('aneis', aneis),
    sharepointDataRepository.writeCollection('gaiolas', gaiolas),
    sharepointDataRepository.writeCollection('ovos', ovos),
    sharepointDataRepository.writeCollection('filhotes', filhotes),
    sharepointDataRepository.writeCollection('especies', especies),
    sharepointDataRepository.writeCollection('financeiro', financeiro),
    sharepointDataRepository.writeCollection('mutacoes', mutacoes),
    sharepointDataRepository.writeCollection('listaItens', listaItens),
  ])

  return {
    criatorio: localCriatorio,
    importedCounts: {
      criatorios: 1,
      plantel: savedAves.length,
      aneis: aneis.length,
      gaiolas: gaiolas.length,
      ovos: ovos.length,
      filhotes: filhotes.length,
      especies: especies.length,
      financeiro: financeiro.length,
      mutacoes: mutacoes.length,
      listaItens: listaItens.length,
    },
    plantel: savedAves,
  }
}

module.exports = {
  importCurrentUserDataFromSharePoint,
}
