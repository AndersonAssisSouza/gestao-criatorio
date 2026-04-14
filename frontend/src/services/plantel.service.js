import api from './api'

function toViewModel(item = {}) {
  return {
    ID: item.id,
    Nome: item.nome || '',
    Status: item.status || 'Vivo',
    NomeMae: item.nomeMae || '',
    NomePai: item.nomePai || '',
    Gaiola: item.gaiola || '',
    DataNascimento: item.dataNascimento || '',
    CategoriaAve: item.categoriaAve || '',
    Genero: item.genero || '',
    Origem: item.origem || '',
    RegistroFOB: item.registroFOB || '',
    AnelEsquerdo: item.anelEsquerdo || '',
    Mutacao: item.mutacao || '',
    observacao: item.observacao || '',
  }
}

function toPayload(item = {}) {
  return {
    nome: item.Nome,
    status: item.Status,
    nomeMae: item.NomeMae,
    nomePai: item.NomePai,
    gaiola: item.Gaiola,
    dataNascimento: item.DataNascimento,
    categoriaAve: item.CategoriaAve,
    genero: item.Genero,
    origem: item.Origem,
    registroFOB: item.RegistroFOB,
    anelEsquerdo: item.AnelEsquerdo,
    mutacao: item.Mutacao,
    observacao: item.observacao,
  }
}

export const plantelService = {
  async listar() {
    const { data } = await api.get('/api/plantel')
    return {
      ...data,
      items: (data.items || []).map(toViewModel),
    }
  },

  async buscarPorId(id) {
    const { data } = await api.get(`/api/plantel/${id}`)
    return { ...data, item: toViewModel(data.item) }
  },

  async criar(payload) {
    const { data } = await api.post('/api/plantel', toPayload(payload))
    return { ...data, item: toViewModel(data.item) }
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/api/plantel/${id}`, toPayload(payload))
    return { ...data, item: toViewModel(data.item) }
  },

  async remover(id) {
    const { data } = await api.delete(`/api/plantel/${id}`)
    return data
  },
}
