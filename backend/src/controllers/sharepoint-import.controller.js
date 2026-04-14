const { importCurrentUserDataFromSharePoint } = require('../services/sharepoint-import.service')
const criatorioRepository = require('../repositories/criatorio.repository')
const plantelRepository = require('../repositories/plantel.repository')
const sharepointDataRepository = require('../repositories/sharepoint-data.repository')

async function importMyData(req, res) {
  try {
    const result = await importCurrentUserDataFromSharePoint(req.user)
    return res.json({
      message: 'Todas as listas do SharePoint foram importadas com sucesso.',
      ...result,
    })
  } catch (error) {
    console.error('[sharepoint/import]', error.message)

    if (error.code === 'CRIATORIO_NOT_FOUND') {
      return res.status(404).json({ message: 'Nenhum criatório seu foi encontrado nas listas do SharePoint.' })
    }

    if (String(error.message || '').includes('Variáveis de ambiente Azure não configuradas')) {
      return res.status(412).json({
        message: 'Faltam as credenciais reais do Azure/SharePoint para importar os dados.',
      })
    }

    return res.status(502).json({
      message: 'Não foi possível importar os dados do SharePoint agora.',
    })
  }
}

async function getMyImportedData(req, res) {
  try {
    const [criatorios, plantel, aneis, gaiolas, ovos, filhotes, especies, financeiro, mutacoes, listaItens] = await Promise.all([
      criatorioRepository.findByUserId(req.user.userId),
      (async () => {
        const userCriatorios = await criatorioRepository.findByUserId(req.user.userId)
        const criatorioId = userCriatorios[0]?.id
        return criatorioId ? plantelRepository.listByCriatorioId(criatorioId) : []
      })(),
      sharepointDataRepository.readCollection('aneis'),
      sharepointDataRepository.readCollection('gaiolas'),
      sharepointDataRepository.readCollection('ovos'),
      sharepointDataRepository.readCollection('filhotes'),
      sharepointDataRepository.readCollection('especies'),
      sharepointDataRepository.readCollection('financeiro'),
      sharepointDataRepository.readCollection('mutacoes'),
      sharepointDataRepository.readCollection('listaItens'),
    ])

    return res.json({
      criatorios,
      plantel,
      aneis,
      gaiolas,
      ovos,
      filhotes,
      especies,
      financeiro,
      mutacoes,
      listaItens,
    })
  } catch (error) {
    console.error('[sharepoint/snapshot]', error.message)
    return res.status(500).json({ message: 'Não foi possível carregar os dados importados.' })
  }
}

module.exports = {
  getMyImportedData,
  importMyData,
}
