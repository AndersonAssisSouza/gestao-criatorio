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

const STATUS_OPTIONS = ['Vivo', 'Filhote', 'Falecimento', 'Vendido', 'Doado']
const GENERO_OPTIONS = ['Macho', 'Femea']

const USE_MOCK = !import.meta.env.VITE_API_URL

const emptyForm = () => ({
  Nome: '', Status: 'Falecimento', NomeMae: '', NomePai: '', Gaiola: '',
  DataNascimento: '', CategoriaAve: '', Genero: '', Origem: '',
  RegistroFOB: '', AnelEsquerdo: '', Mutacao: '', observacao: '',
})

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
  const [formMode,   setFormMode]   = useState(null) // null | 'new' | 'edit' | 'view'
  const [formData,   setFormData]   = useState(emptyForm())
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
    setFormData({ ...ave })
    setFormMode('view')
  }

  // ─── Ações do toolbar ────────────────────────────────────────────────────
  const handleNew = () => {
    setSelected(null)
    setFormData(emptyForm())
    setFormMode('new')
  }

  const handleEdit = () => {
    if (!selected) return
    setFormMode('edit')
  }

  const handleCancel = () => {
    if (selected) {
      setFormData({ ...selected })
      setFormMode('view')
    } else {
      setFormData(emptyForm())
      setFormMode(null)
    }
  }

  const handleSubmit = () => {
    const action = formMode === 'new'
      ? plantelService.criar(formData)
      : plantelService.atualizar(selected.ID, formData)

    action
      .then((response) => {
        const item = response.item
        if (formMode === 'new') {
          setData((current) => [...current, item])
        } else {
          setData((current) => current.map((record) => (record.ID === selected.ID ? item : record)))
        }
        setSelected(item)
        setFormData({ ...item })
        setFormMode('view')
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Não foi possível salvar o registro.')
      })
  }

  const handleDeleteConfirm = () => {
    plantelService.remover(delTarget.ID)
      .then(() => {
        setData((current) => current.filter((record) => record.ID !== delTarget.ID))
        if (selected?.ID === delTarget.ID) {
          setSelected(null)
          setFormMode(null)
          setFormData(emptyForm())
        }
        setDelTarget(null)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Não foi possível remover o registro.')
      })
  }

  // ─── Field helpers ────────────────────────────────────────────────────────
  const isNewMode  = formMode === 'new'
  const isEditMode = formMode === 'edit'
  const isViewMode = formMode === 'view'
  const canEditField = (field) => {
    const newOnly = ['Nome', 'NomeMae', 'NomePai', 'DataNascimento', 'RegistroFOB', 'Origem']
    const editableInEdit = ['Gaiola', 'observacao']
    const filhoteOrNew = ['CategoriaAve', 'Genero']

    if (isNewMode) return true
    if (isEditMode) {
      if (editableInEdit.includes(field)) return true
      if (field === 'Status') return true
      if (field === 'AnelEsquerdo') return true
      if (field === 'Mutacao') return true
      if (filhoteOrNew.includes(field) && formData.Status === 'Filhote') return true
      if (field === 'Gaiola') return true
      return false
    }
    return false
  }

  const setField = (key, val) => setFormData(f => ({ ...f, [key]: val }))

  const renderInput = (key, label, opts = {}) => {
    const editable = canEditField(key)
    const { type = 'text', options, fullWidth, placeholder } = opts
    const wrapClass = fullWidth ? 'p-field p-form-grid--full' : 'p-field'

    if (type === 'dropdown') {
      return (
        <div className={wrapClass} key={key}>
          <label className="p-label">{label}</label>
          <select
            className="p-select"
            value={formData[key] || ''}
            onChange={e => setField(key, e.target.value)}
            disabled={!editable}
          >
            <option value="">-- Selecionar --</option>
            {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )
    }

    if (type === 'date') {
      if (isNewMode) {
        return (
          <div className={wrapClass} key={key}>
            <label className="p-label">{label}</label>
            <input
              type="date"
              className="p-input"
              value={formData[key] || ''}
              onChange={e => setField(key, e.target.value)}
            />
          </div>
        )
      }
      return (
        <div className={wrapClass} key={key}>
          <label className="p-label">{label}</label>
          <input className="p-input" value={formData[key] || ''} disabled readOnly />
        </div>
      )
    }

    if (type === 'textarea') {
      return (
        <div className={wrapClass} key={key}>
          <label className="p-label">{label}</label>
          <textarea
            className="p-textarea"
            value={formData[key] || ''}
            onChange={e => setField(key, e.target.value)}
            disabled={!editable}
            placeholder={placeholder || ''}
          />
        </div>
      )
    }

    return (
      <div className={wrapClass} key={key}>
        <label className="p-label">{label}</label>
        <input
          className="p-input"
          value={formData[key] || ''}
          onChange={e => setField(key, e.target.value)}
          disabled={!editable}
          placeholder={placeholder || ''}
        />
      </div>
    )
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
              <button className="p-btn p-btn--primary p-btn--sm" onClick={handleNew} title="Novo registro">+</button>
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
                  <div className="text-muted" style={{ fontSize: 11, marginBottom: 6 }}>{ave.CategoriaAve} &middot; {ave.Genero}</div>
                  <StatusBadge status={ave.Status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Form ─────────────────────────────────────────────────── */}
        <div className="plantel-detail">
          {/* Toolbar */}
          <div className="p-panel-header">
            <div className="p-panel-header__title">
              {formMode === 'new' ? 'Novo Registro' : formMode === 'edit' ? `Editando: ${formData.Nome}` : selected ? selected.Nome : 'Detalhes'}
            </div>
            <div className="flex gap-2">
              {(formMode === 'new' || formMode === 'edit') && (
                <>
                  <button className="p-btn p-btn--primary p-btn--sm" onClick={handleSubmit} title="Salvar">💾</button>
                  <button className="p-btn p-btn--secondary p-btn--sm" onClick={handleCancel} title="Cancelar">✕</button>
                </>
              )}
              {formMode === 'view' && selected && (
                <>
                  <button className="p-btn p-btn--secondary p-btn--sm" onClick={handleEdit} title="Editar">✏️</button>
                  <button className="p-btn p-btn--danger p-btn--sm" onClick={() => setDelTarget(selected)} title="Excluir">🗑️</button>
                </>
              )}
            </div>
          </div>

          {/* Form Content */}
          {!formMode ? (
            <div className="module-empty">
              <div style={{ fontSize: 36, opacity: 0.4 }}>📋</div>
              <div>Selecione um registro ou clique + para cadastrar</div>
            </div>
          ) : (
            <div className="p-panel-body">
              <div className="p-form-grid">
                {/* 1. Nome */}
                {renderInput('Nome', 'Nome', { placeholder: 'Nome da ave' })}

                {/* 2. Status */}
                {renderInput('Status', 'Status', { type: 'dropdown', options: STATUS_OPTIONS })}

                {/* 3. NomeMae */}
                {renderInput('NomeMae', 'Nome da Mãe', { placeholder: 'Mãe' })}

                {/* 4. NomePai */}
                {renderInput('NomePai', 'Nome do Pai', { placeholder: 'Pai' })}

                {/* 5. Gaiola */}
                {renderInput('Gaiola', 'Gaiola', { type: 'dropdown', options: catalogs.gaiolas })}

                {/* 6. DataNascimento */}
                {renderInput('DataNascimento', 'Data de Nascimento', { type: 'date' })}

                {/* 7. CategoriaAve / Espécie */}
                {renderInput('CategoriaAve', 'Espécie', { type: 'dropdown', options: catalogs.especies })}

                {/* 8. Genero */}
                {renderInput('Genero', 'Gênero', { type: 'dropdown', options: GENERO_OPTIONS })}

                {/* 9. Origem / Criatório */}
                {renderInput('Origem', 'Criatório / Origem', { type: 'dropdown', options: catalogs.criatorios })}

                {/* 10. RegistroFOB */}
                {renderInput('RegistroFOB', 'Registro FOB', { placeholder: 'FOB-XXX' })}

                {/* 11. AnelEsquerdo */}
                {renderInput('AnelEsquerdo', 'Anel Esquerdo', { type: 'dropdown', options: catalogs.aneis })}

                {/* 12. Mutacao */}
                {renderInput('Mutacao', 'Mutação', { type: 'dropdown', options: catalogs.mutacoes })}

                {/* 13. observacao */}
                {renderInput('observacao', 'Observações', { type: 'textarea', fullWidth: true, placeholder: 'Notas adicionais...' })}
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
