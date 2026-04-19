import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { StatusBadge }   from '../../shared/StatusBadge'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { plantelService } from '../../../services/plantel.service'
import { accessService } from '../../../services/access.service'

// ─── MOCK — dados reais do SharePoint ────────────────────────────────────────
const MOCK_ALL = [
  { ID: 1, Nome: 'Cinzinha', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '', CategoriaAve: 'Tarim', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB-002-2021', Mutacao: 'Ancestral', Acesso: 'Anderson Assis', observacao: 'Ave faleceu sem motivo aparente durante 2ª choca da temporada 2023' },
  { ID: 2, Nome: 'Red', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '15/08/2021', CategoriaAve: 'Tarim', Genero: 'Macho', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Portador de Canela', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 3, Nome: 'Pardinha', Status: 'Falecimento', NomeMae: 'Cinzinha', NomePai: 'Red', Gaiola: '', DataNascimento: '20/01/2023', CategoriaAve: 'Tarim', Genero: 'Fêmea', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Canela', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 4, Nome: 'Manchinha', Status: 'Vivo', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '10/08/2023', CategoriaAve: 'Tarim', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 031 - 2023', Mutacao: 'Canela Pastel', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 5, Nome: 'Hulk', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '002', DataNascimento: '30/07/2023', CategoriaAve: 'Tarim', Genero: 'Macho', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 019 - 2023', Mutacao: 'Canela Pastel', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 6, Nome: 'Mainha', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '11/05/2021', CategoriaAve: 'Tarim', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 004 - 2021', Mutacao: 'Ancestral', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 7, Nome: 'Pastelzinha', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '002', DataNascimento: '11/10/2022', CategoriaAve: 'Tarim', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 284 - 2022', Mutacao: 'Pastel', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 8, Nome: 'Hulk', Status: 'Vivo', NomeMae: 'NA', NomePai: 'NA', Gaiola: '002', DataNascimento: '', CategoriaAve: 'Tarim', Genero: 'Macho', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Canela', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 9, Nome: 'Pardinho', Status: 'Vivo', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '10/08/2023', CategoriaAve: 'Tarim', Genero: 'Macho', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Duplo Diluído', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 10, Nome: 'Bandite', Status: 'Vivo', NomeMae: '', NomePai: '', Gaiola: '003', DataNascimento: '', CategoriaAve: 'canário belga', Genero: 'Macho', Origem: 'Criatório Assis', RegistroFOB: '', AnelEsquerdo: '', Mutacao: '', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 11, Nome: 'Pardinha', Status: 'Vivo', NomeMae: 'Manchinha', NomePai: 'Pardinho', Gaiola: '003', DataNascimento: '2025-11-18', CategoriaAve: 'Tarim', Genero: 'Femea', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '002', Mutacao: 'Canela Pastel', Acesso: 'Anderson Assis', observacao: '' },
]

const MOCK_ESPECIES = [{ Especie: 'Tarim' }, { Especie: 'canário belga' }]
const MOCK_GAIOLAS = [{ NumeroGaiola: '001' }, { NumeroGaiola: '002' }, { NumeroGaiola: '003' }]
const MOCK_CRIATORIOS = [{ NomeCriatorio: 'Criatório Assis' }, { NomeCriatorio: 'Criatório 2W' }]
const MOCK_ANEIS = [{ NumeroAnel: '033' }, { NumeroAnel: '002' }, { NumeroAnel: 'JI783' }]
const MOCK_MUTACOES = ['Ancestral', 'Canela', 'Pastel', 'Canela Pastel', 'Portador de Canela', 'Duplo Diluído', 'Topázio', 'Diluído']

const USE_MOCK = !import.meta.env.VITE_API_URL

function normalizeGenero(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'femea' || normalized === 'fêmea') return 'Fêmea'
  if (normalized === 'macho') return 'Macho'
  return String(value || '').trim()
}

function normalizeEspecie(value = '') {
  const text = String(value || '').trim()
  if (!text) return ''

  return text
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function ExPlantelModule() {
  const [data,       setData]       = useState([])
  const [catalogs, setCatalogs] = useState({
    especies: MOCK_ESPECIES.map((item) => item.Especie),
    gaiolas: MOCK_GAIOLAS.map((item) => item.NumeroGaiola),
    criatorios: MOCK_CRIATORIOS.map((item) => item.NomeCriatorio),
    aneis: MOCK_ANEIS.map((item) => item.NumeroAnel),
    mutacoes: MOCK_MUTACOES,
  })
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [error,      setError]      = useState('')

  // ─── Carregamento inicial ─────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    if (USE_MOCK) {
      setTimeout(() => { setData(MOCK_ALL); setLoading(false) }, 400)
    } else {
      Promise.all([
        plantelService.listar(),
        accessService.getImportedSharePointData(),
      ])
        .then(([response, snapshot]) => {
          setData(response.items || [])
          const mutacoes = [
            ...(snapshot.mutacoes || []).flatMap((item) => [
              item.MutacaoMacho,
              item.MutacaoFemea,
              item.MutacaoFilhoteMacho,
              item.MutacaoFilhoteFemea,
            ]),
            ...(response.items || []).map((item) => item.Mutacao),
          ]
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index)

          setCatalogs({
            especies: (snapshot.especies || []).map((item) => item.Especie).filter(Boolean),
            gaiolas: (snapshot.gaiolas || []).map((item) => item.NumeroGaiola).filter(Boolean),
            criatorios: (snapshot.criatorios || []).map((item) => item.NomeCriatorio).filter(Boolean),
            aneis: (snapshot.aneis || []).map((item) => item.NumeroAnel).filter(Boolean),
            mutacoes: mutacoes.length > 0 ? mutacoes : MOCK_MUTACOES,
          })
          setError('')
        })
        .catch((requestError) => {
          setError(requestError.response?.data?.message || 'Não foi possível carregar o ex-plantel.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  // ─── Dados filtrados (somente Status !== "Vivo") ──────────────────────────
  const exPlantel = data.filter(r => r.Status !== 'Vivo')
  const filtered = exPlantel.filter(r =>
    r.Nome.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:       exPlantel.length,
    falecimento: exPlantel.filter(r => r.Status === 'Falecimento').length,
    vendidos:    exPlantel.filter(r => r.Status === 'Vendido').length,
    doados:      exPlantel.filter(r => r.Status === 'Doado').length,
  }

  // ─── Seleção na galeria ───────────────────────────────────────────────────
  const handleSelect = (ave) => {
    setSelected(ave)
  }

  const handleDeleteConfirm = () => {
    plantelService.remover(delTarget.ID)
      .then(() => {
        setData((current) => current.filter((record) => record.ID !== delTarget.ID))
        if (selected?.ID === delTarget.ID) {
          setSelected(null)
        }
        setDelTarget(null)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Não foi possível remover o registro.')
      })
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="module-empty">
      Carregando ex-plantel...
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Histórico</div>
          <h2 className="module-hero__title">Ex-plantel</h2>
          <div className="module-hero__text">
            Reúna aves que saíram do plantel, preservando origem, motivo de saída e contexto histórico para consultas futuras.
          </div>
        </div>
        <div className="pill">Memória do plantel</div>
      </div>

      {error && <div className="p-alert--error">{error}</div>}

      {/* Stats */}
      <div className="p-stats">
        <StatCard label="Total Ex-Plantel" value={stats.total}       desc="aves desligadas"       color="#C95025" />
        <StatCard label="Falecimento"      value={stats.falecimento} desc="falecimentos"           color="#E05C4B" />
        <StatCard label="Vendidos"         value={stats.vendidos}    desc="aves vendidas"           color="#F5A623" />
        <StatCard label="Doados"           value={stats.doados}      desc="aves doadas"             color="#9B8EC4" />
      </div>

      {/* Master-Detail */}
      <div className="plantel-master module-panel">
        {/* ── LEFT: Gallery ───────────────────────────────────────────────── */}
        <div className="plantel-gallery">
          <div className="p-panel-header flex-col">
            <div className="p-panel-header__title">Ex-Plantel</div>
            <div className="p-panel-search">
              <input
                className="p-search"
                placeholder="Buscar por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
            </div>
          </div>

          <div className="p-panel-list">
            {filtered.length === 0 ? (
              <div className="module-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div className="text-muted" style={{ fontSize: 12 }}>Nenhum registro encontrado</div>
              </div>
            ) : (
              filtered.map(ave => (
                <div
                  key={ave.ID}
                  className={`p-list-item${selected?.ID === ave.ID ? ' is-active' : ''}`}
                  onClick={() => handleSelect(ave)}
                >
                  <div className="font-serif" style={{ fontSize: 16, marginBottom: 3 }}>{ave.Nome}</div>
                  <div className="text-muted" style={{ fontSize: 11, marginBottom: 6 }}>
                    {normalizeEspecie(ave.CategoriaAve)} &middot; {normalizeGenero(ave.Genero)}
                  </div>
                  <StatusBadge status={ave.Status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Form ─────────────────────────────────────────────────── */}
        <div className="plantel-detail">
          <div className="p-panel-header">
            <div className="p-panel-header__title">
              {selected ? selected.Nome : 'Detalhes'}
            </div>
            {selected && (
              <div className="flex gap-2">
                <button className="p-btn p-btn--danger p-btn--sm" onClick={() => setDelTarget(selected)} title="Excluir">🗑️</button>
              </div>
            )}
          </div>

          {!selected ? (
            <div className="module-empty">
              <div style={{ fontSize: 36, opacity: 0.4 }}>📋</div>
              <div>Selecione uma ave para visualizar os detalhes</div>
            </div>
          ) : (
            <div className="p-panel-body">
              <div className="p-form-grid">
                <div className="p-field">
                  <label className="p-label">Nome</label>
                  <input className="p-input" value={selected.Nome || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Status</label>
                  <input className="p-input" value={selected.Status || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Nome da Mãe</label>
                  <input className="p-input" value={selected.NomeMae || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Nome do Pai</label>
                  <input className="p-input" value={selected.NomePai || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Gaiola</label>
                  <input className="p-input" value={selected.Gaiola || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Data de Nascimento</label>
                  <input className="p-input" value={selected.DataNascimento || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Espécie</label>
                  <input className="p-input" value={normalizeEspecie(selected.CategoriaAve)} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Gênero</label>
                  <input className="p-input" value={normalizeGenero(selected.Genero)} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Criatório / Origem</label>
                  <input className="p-input" value={selected.Origem || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Registro FOB</label>
                  <input className="p-input" value={selected.RegistroFOB || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Anel Esquerdo</label>
                  <input className="p-input" value={selected.AnelEsquerdo || ''} disabled readOnly />
                </div>
                <div className="p-field">
                  <label className="p-label">Mutação</label>
                  <input className="p-input" value={selected.Mutacao || ''} disabled readOnly />
                </div>
                <div className="p-field p-form-grid--full">
                  <label className="p-label">Observações</label>
                  <textarea className="p-textarea" value={selected.observacao || ''} disabled readOnly />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {delTarget && (
        <ConfirmModal
          title="Remover registro do ex-plantel?"
          message={`O registro de "${delTarget.Nome}" será removido permanentemente. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
