const sp = require('../services/sharepoint.service')

// Mapeamento: campo frontend → campo SharePoint
const toSP = (body) => ({
  Title:            body.nome,
  Status:           body.status,
  NomeMae:          body.nomeMae,
  NomePai:          body.nomePai,
  Gaiola:           body.gaiola,
  DataNascimento:   body.dataNascimento,
  CategoriaAve:     body.categoriaAve,
  Genero:           body.genero,
  Origem:           body.origem,
  RegistroFOB:      body.registroFOB,
  AnelEsquerdo:     body.anelEsquerdo,
})

const fromSP = (item) => ({
  id:               item.id,
  nome:             item.Title       || item.nome || '',
  status:           item.Status      || 'Ativo',
  nomeMae:          item.NomeMae     || '',
  nomePai:          item.NomePai     || '',
  gaiola:           item.Gaiola      || '',
  dataNascimento:   item.DataNascimento || '',
  categoriaAve:     item.CategoriaAve  || '',
  genero:           item.Genero      || '',
  origem:           item.Origem      || '',
  registroFOB:      item.RegistroFOB || '',
  anelEsquerdo:     item.AnelEsquerdo || '',
})

async function listar(req, res) {
  try {
    const items = await sp.listarItens('plantel')
    res.json({ items: items.map(fromSP) })
  } catch (e) {
    console.error('[plantel/listar]', e.message)
    res.status(502).json({ message: 'Erro ao buscar dados do SharePoint.' })
  }
}

async function buscarPorId(req, res) {
  try {
    const item = await sp.buscarItem('plantel', req.params.id)
    res.json({ item: fromSP(item) })
  } catch (e) {
    console.error('[plantel/buscarPorId]', e.message)
    res.status(404).json({ message: 'Ave não encontrada.' })
  }
}

async function criar(req, res) {
  try {
    const { nome, categoriaAve, genero, status } = req.body
    if (!nome || !categoriaAve || !genero || !status) {
      return res.status(400).json({ message: 'Campos obrigatórios: nome, categoriaAve, genero, status.' })
    }
    const item = await sp.criarItem('plantel', toSP(req.body))
    res.status(201).json({ item: fromSP(item) })
  } catch (e) {
    console.error('[plantel/criar]', e.message)
    res.status(502).json({ message: 'Erro ao criar ave no SharePoint.' })
  }
}

async function atualizar(req, res) {
  try {
    const item = await sp.atualizarItem('plantel', req.params.id, toSP(req.body))
    res.json({ item: fromSP({ id: req.params.id, ...item }) })
  } catch (e) {
    console.error('[plantel/atualizar]', e.message)
    res.status(502).json({ message: 'Erro ao atualizar ave no SharePoint.' })
  }
}

async function remover(req, res) {
  try {
    await sp.deletarItem('plantel', req.params.id)
    res.json({ success: true })
  } catch (e) {
    console.error('[plantel/remover]', e.message)
    res.status(502).json({ message: 'Erro ao remover ave do SharePoint.' })
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover }
