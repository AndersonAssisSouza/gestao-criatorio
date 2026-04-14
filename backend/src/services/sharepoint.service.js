const axios            = require('axios')
const { getGraphToken } = require('./token.service')

// IDs das listas SharePoint (mapeados do arquivo .msapp original)
const LISTS = {
  plantel:           '2ae6b6b8-2ae8-46d0-a73b-fa0e12a5e61e',
  ovos:              '07fce76a-6995-450e-993e-1c6957127e0f',
  gaiolas:           '61475464-d869-4f20-8c74-788a3a6161a2',
  filhotes:          '5185b4bd-7de7-47f3-9d00-7ba74c4fc48d',
  especieAve:        'ac71e1a0-4be9-4fe2-b33f-a795e26b1bd1',
  gestaoCriatorio:   '68e852eb-3cc4-4d39-b7fe-3a7b03e178ba',
  aneis:             'e40b89e9-d600-4942-8a14-e2fe7590520d',
  controleFinanceiro:'ce7d2013-e220-45cb-b1df-0c2e85248b09',
  mutacaoTarin:      '247ec50c-c6a2-4cfc-88c0-d2ea2da195a4',
  listaItens:        'dcc9ec04-dece-4aec-ae5b-92e247570027',
}

async function getSiteId() {
  const token      = await getGraphToken()
  const siteUrl    = process.env.SHAREPOINT_SITE_URL
  const parsedUrl  = new URL(siteUrl)
  const url        = `https://graph.microsoft.com/v1.0/sites/${parsedUrl.host}:${parsedUrl.pathname}`

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    proxy: false,
  })
  return data.id
}

/**
 * Listar itens de uma lista SharePoint
 */
async function listarItens(listKey, select = null) {
  const token  = await getGraphToken()
  const siteId = await getSiteId()
  const listId = LISTS[listKey]

  if (!listId) throw new Error(`Lista não encontrada: ${listKey}`)

  let url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`
  if (select) url += `&$select=fields/${select}`

  const items = []

  while (url) {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      proxy: false,
    })

    items.push(...data.value.map(item => ({ id: item.id, ...item.fields })))
    url = data['@odata.nextLink'] || null
  }

  return items
}

/**
 * Buscar item por ID
 */
async function buscarItem(listKey, itemId) {
  const token  = await getGraphToken()
  const siteId = await getSiteId()
  const listId = LISTS[listKey]

  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}?expand=fields`
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    proxy: false,
  })
  return { id: data.id, ...data.fields }
}

/**
 * Criar item em uma lista
 */
async function criarItem(listKey, fields) {
  const token  = await getGraphToken()
  const siteId = await getSiteId()
  const listId = LISTS[listKey]

  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`
  const { data } = await axios.post(url, { fields }, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    proxy: false,
  })
  return { id: data.id, ...data.fields }
}

/**
 * Atualizar item
 */
async function atualizarItem(listKey, itemId, fields) {
  const token  = await getGraphToken()
  const siteId = await getSiteId()
  const listId = LISTS[listKey]

  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}/fields`
  const { data } = await axios.patch(url, fields, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    proxy: false,
  })
  return { id: itemId, ...data }
}

/**
 * Deletar item
 */
async function deletarItem(listKey, itemId) {
  const token  = await getGraphToken()
  const siteId = await getSiteId()
  const listId = LISTS[listKey]

  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}`
  await axios.delete(url, {
    headers: { Authorization: `Bearer ${token}` },
    proxy: false,
  })
  return true
}

module.exports = { listarItens, buscarItem, criarItem, atualizarItem, deletarItem, LISTS }
