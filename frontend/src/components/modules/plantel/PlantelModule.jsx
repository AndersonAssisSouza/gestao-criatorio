import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { plantelService } from '../../../services/plantel.service'
import { accessService } from '../../../services/access.service'

const MOCK_PLANTEL = [
  { ID: 1, Nome: 'Cinzinha', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '', CategoriaAve: 'Tarin', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB-002-2021', Mutacao: 'Ancestral', Acesso: 'Anderson Assis', observacao: 'Ave faleceu sem motivo aparente durante 2ª choca da temporada 2023' },
  { ID: 2, Nome: 'Red', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '15/08/2021', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Portador de Canela', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 3, Nome: 'Pardinha', Status: 'Falecimento', NomeMae: 'Cinzinha', NomePai: 'Red', Gaiola: '', DataNascimento: '20/01/2023', CategoriaAve: 'Tarin', Genero: 'Fêmea', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Canela', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 4, Nome: 'Manchinha', Status: 'Vivo', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '10/08/2023', CategoriaAve: 'Tarin', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 031 - 2023', Mutacao: 'Canela Pastel', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 5, Nome: 'Hulk', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '002', DataNascimento: '30/07/2023', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 019 - 2023', Mutacao: 'Canela Pastel', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 6, Nome: 'Mainha', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '11/05/2021', CategoriaAve: 'Tarin', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 004 - 2021', Mutacao: 'Ancestral', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 7, Nome: 'Pastelzinha', Status: 'Falecimento', NomeMae: 'NA', NomePai: 'NA', Gaiola: '002', DataNascimento: '11/10/2022', CategoriaAve: 'Tarin', Genero: 'Fêmea', Origem: 'Criatório 2W', RegistroFOB: '5177616', AnelEsquerdo: 'FOB - 284 - 2022', Mutacao: 'Pastel', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 8, Nome: 'Hulk', Status: 'Vivo', NomeMae: 'NA', NomePai: 'NA', Gaiola: '002', DataNascimento: '', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Canela', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 9, Nome: 'Pardinho', Status: 'Vivo', NomeMae: 'NA', NomePai: 'NA', Gaiola: '001', DataNascimento: '10/08/2023', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '', Mutacao: 'Duplo Diluído', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 10, Nome: 'Bandite', Status: 'Vivo', NomeMae: '', NomePai: '', Gaiola: '003', DataNascimento: '', CategoriaAve: 'canário belga', Genero: 'Macho', Origem: 'Criatório Assis', RegistroFOB: '', AnelEsquerdo: '', Mutacao: '', Acesso: 'Anderson Assis', observacao: '' },
  { ID: 11, Nome: 'Pardinha', Status: 'Vivo', NomeMae: 'Manchinha', NomePai: 'Pardinho', Gaiola: '003', DataNascimento: '2025-11-18', CategoriaAve: 'Tarin', Genero: 'Femea', Origem: 'Criatório Assis', RegistroFOB: '5177616', AnelEsquerdo: '002', Mutacao: 'Canela Pastel', Acesso: 'Anderson Assis', observacao: '' },
]

const MOCK_ESPECIES = [{ Especie: 'Tarin' }, { Especie: 'canário belga' }]
const MOCK_GAIOLAS = [{ NumeroGaiola: '001' }, { NumeroGaiola: '002' }, { NumeroGaiola: '003' }]
const MOCK_CRIATORIOS = [{ NomeCriatorio: 'Criatório Assis' }, { NomeCriatorio: 'Criatório 2W' }]
const MOCK_ANEIS = [{ NumeroAnel: '033' }, { NumeroAnel: '002' }, { NumeroAnel: 'JI783' }]
const MOCK_MUTACOES = ['Ancestral', 'Canela', 'Pastel', 'Canela Pastel', 'Portador de Canela', 'Duplo Diluído', 'Topázio', 'Diluído']

const STATUS_OPTIONS = ['Vivo', 'Filhote', 'Falecimento', 'Vendido', 'Doado']
const GENERO_OPTIONS = ['Macho', 'Femea']
const USE_MOCK = !import.meta.env.VITE_API_URL

const emptyForm = () => ({
  Nome: '',
  Status: 'Vivo',
  NomeMae: '',
  NomePai: '',
  Gaiola: '',
  DataNascimento: '',
  CategoriaAve: '',
  Genero: '',
  Origem: '',
  RegistroFOB: '',
  AnelEsquerdo: '',
  Mutacao: '',
  observacao: '',
})

function normalizeKey(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function buildMutationCatalog(records = []) {
  return records.reduce((accumulator, item) => {
    const speciesKey = normalizeKey(item.Especie)
    if (!speciesKey) return accumulator

    const nextOptions = [
      item.MutacaoMacho,
      item.MutacaoFemea,
      item.MutacaoFilhoteMacho,
      item.MutacaoFilhoteFemea,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)

    accumulator[speciesKey] = [...new Set([...(accumulator[speciesKey] || []), ...nextOptions])]
    return accumulator
  }, {})
}

export function PlantelModule() {
  const [data, setData] = useState([])
  const [catalogs, setCatalogs] = useState({
    especies: MOCK_ESPECIES.map((item) => item.Especie),
    gaiolas: MOCK_GAIOLAS.map((item) => item.NumeroGaiola),
    criatorios: MOCK_CRIATORIOS.map((item) => item.NomeCriatorio),
    aneis: MOCK_ANEIS.map((item) => item.NumeroAnel),
    mutacoes: MOCK_MUTACOES,
    mutacoesPorEspecie: {},
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [delTarget, setDelTarget] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    if (USE_MOCK) {
      setTimeout(() => {
        setData(MOCK_PLANTEL)
        setLoading(false)
      }, 400)
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
          const mutacoesPorEspecie = buildMutationCatalog(snapshot.mutacoes || [])

          setCatalogs({
            especies: (snapshot.especies || []).map((item) => item.Especie).filter(Boolean),
            gaiolas: (snapshot.gaiolas || []).map((item) => item.NumeroGaiola).filter(Boolean),
            criatorios: (snapshot.criatorios || []).map((item) => item.NomeCriatorio).filter(Boolean),
            aneis: (snapshot.aneis || []).map((item) => item.NumeroAnel).filter(Boolean),
            mutacoes: mutacoes.length > 0 ? mutacoes : MOCK_MUTACOES,
            mutacoesPorEspecie,
          })
          setError('')
        })
        .catch((requestError) => {
          setError(requestError.response?.data?.message || 'Não foi possível carregar o plantel.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  const vivosOnly = data.filter((record) => record.Status === 'Vivo')
  const filtered = vivosOnly.filter((record) => record.Nome.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total: vivosOnly.length,
    machos: vivosOnly.filter((record) => record.Genero === 'Macho').length,
    femeas: vivosOnly.filter((record) => record.Genero === 'Femea').length,
    gaiolas: [...new Set(vivosOnly.map((record) => record.Gaiola).filter(Boolean))].length,
  }

  const handleSelect = (ave) => {
    setSelected(ave)
    setFormData({ ...ave })
    setFormMode('view')
  }

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

  const handleSubmit = async () => {
    try {
      setError('')

      if (formMode === 'new') {
        const response = await plantelService.criar(formData)
        const newRecord = response.item
        setData((current) => [...current, newRecord])
        setSelected(newRecord)
        setFormData({ ...newRecord })
        setFormMode('view')
        return
      }

      if (formMode === 'edit' && selected) {
        const response = await plantelService.atualizar(selected.ID, formData)
        const updated = response.item
        setData((current) => current.map((record) => (record.ID === selected.ID ? updated : record)))
        setSelected(updated)
        setFormData({ ...updated })
        setFormMode('view')
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível salvar a ave.')
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      setError('')
      await plantelService.remover(delTarget.ID)
      setData((current) => current.filter((record) => record.ID !== delTarget.ID))
      if (selected?.ID === delTarget.ID) {
        setSelected(null)
        setFormMode(null)
        setFormData(emptyForm())
      }
      setDelTarget(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível remover a ave.')
    }
  }

  const isNewMode = formMode === 'new'
  const isEditMode = formMode === 'edit'

  const canEditField = (field) => {
    const editableInEdit = ['Gaiola', 'observacao', 'Status', 'AnelEsquerdo', 'Mutacao']
    const filhoteOrNew = ['CategoriaAve', 'Genero']

    if (isNewMode) return true
    if (isEditMode) {
      if (editableInEdit.includes(field)) return true
      if (filhoteOrNew.includes(field) && formData.Status === 'Filhote') return true
      return false
    }
    return false
  }

  const setField = (key, value) => setFormData((current) => ({ ...current, [key]: value }))
  const mutationOptionsForSpecies = catalogs.mutacoesPorEspecie[normalizeKey(formData.CategoriaAve)] || []

  const setSpecies = (value) => {
    const nextMutationOptions = catalogs.mutacoesPorEspecie[normalizeKey(value)] || []
    setFormData((current) => ({
      ...current,
      CategoriaAve: value,
      Mutacao: nextMutationOptions.includes(current.Mutacao) ? current.Mutacao : '',
    }))
  }

  const renderInput = (key, label, opts = {}) => {
    const editable = canEditField(key)
    const { type = 'text', options, fullWidth, placeholder } = opts
    const wrapClass = fullWidth ? 'p-field p-form-grid--full' : 'p-field'

    if (type === 'dropdown') {
      const onChange = key === 'CategoriaAve'
        ? (event) => setSpecies(event.target.value)
        : (event) => setField(key, event.target.value)

      return (
        <div className={wrapClass} key={key}>
          <label className="p-label">{label}</label>
          <select className="p-select" value={formData[key] || ''} onChange={onChange} disabled={!editable}>
            <option value="">Selecionar</option>
            {(options || []).map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      )
    }

    if (type === 'date') {
      if (isNewMode) {
        return (
          <div className={wrapClass} key={key}>
            <label className="p-label">{label}</label>
            <input type="date" className="p-input" value={formData[key] || ''} onChange={(e) => setField(key, e.target.value)} />
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
          <textarea className="p-textarea" value={formData[key] || ''} onChange={(e) => setField(key, e.target.value)} disabled={!editable} placeholder={placeholder || ''} />
        </div>
      )
    }

    return (
      <div className={wrapClass} key={key}>
        <label className="p-label">{label}</label>
        <input className="p-input" value={formData[key] || ''} onChange={(e) => setField(key, e.target.value)} disabled={!editable} placeholder={placeholder || ''} />
      </div>
    )
  }

  if (loading) {
    return <div className="module-empty">Carregando plantel...</div>
  }

  return (
    <div className="page-block flex flex-col gap-3">
      {error && <div className="p-alert--error">{error}</div>}

      <div className="p-stats">
        <StatCard label="Total vivos" value={stats.total} desc="aves ativas no plantel" color="#C95025" />
        <StatCard label="Machos" value={stats.machos} desc="reprodutores disponíveis" color="#4CAF7D" />
        <StatCard label="Fêmeas" value={stats.femeas} desc="matrizes em acompanhamento" color="#F5A623" />
        <StatCard label="Gaiolas" value={stats.gaiolas} desc="ocupações distintas mapeadas" color="#5BC0EB" />
      </div>

      <div className="plantel-master">
        <section className="plantel-gallery">
          <div className="p-panel-header">
            <div>
              <div className="module-hero__eyebrow">Painel vivo</div>
              <div className="p-panel-header__title">Consulta rápida do plantel</div>
              <p className="p-panel-header__subtitle">Busque uma ave, abra a ficha e faça ajustes sem perder o contexto do restante do plantel.</p>
            </div>
          </div>

          <div className="p-panel-search">
            <input
              className="p-search"
              placeholder="Buscar por nome da ave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="p-btn p-btn--primary" onClick={handleNew}>Nova ave</button>
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
            <div className="module-panel" style={{ flex: 1, padding: '8px 10px', textAlign: 'center' }}>
              <div className="text-faint" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filtradas</div>
              <div className="font-serif" style={{ fontSize: 15 }}>{filtered.length}</div>
            </div>
            <div className="module-panel" style={{ flex: 1, padding: '8px 10px', textAlign: 'center' }}>
              <div className="text-faint" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Origens</div>
              <div className="font-serif" style={{ fontSize: 15 }}>{new Set(vivosOnly.map((item) => item.Origem)).size}</div>
            </div>
            <div className="module-panel" style={{ flex: 1, padding: '8px 10px', textAlign: 'center' }}>
              <div className="text-faint" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mutações</div>
              <div className="font-serif" style={{ fontSize: 15 }}>{new Set(vivosOnly.map((item) => item.Mutacao)).size}</div>
            </div>
          </div>

          <div className="p-panel-list">
            {filtered.length === 0 ? (
              <div className="module-empty">
                <div>
                  <div style={{ fontSize: 38, marginBottom: 12 }}>Sem resultados</div>
                  <div style={{ lineHeight: 1.7 }}>Ajuste a busca ou crie uma nova ave para alimentar o plantel.</div>
                </div>
              </div>
            ) : (
              filtered.map((ave) => (
                <button key={ave.ID} type="button" className={`plantel-card${selected?.ID === ave.ID ? ' is-active' : ''}`} onClick={() => handleSelect(ave)}>
                  <div className="plantel-card__avatar">
                    {ave.Nome.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="plantel-card__info">
                    <div className="plantel-card__name">{ave.Nome}</div>
                    <div className="plantel-card__meta">{ave.CategoriaAve} · {ave.Genero} · {ave.Gaiola || 'Sem gaiola'}</div>
                    <div className="plantel-card__tags">{ave.Mutacao || 'SEM MUTAÇÃO'} · {ave.AnelEsquerdo || 'SEM ANEL'}</div>
                  </div>
                  <div className="plantel-card__status">
                    <StatusBadge status={ave.Status} />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="plantel-detail">
          <div className="p-panel-header">
            <div>
              <div className="module-hero__eyebrow">Ficha operacional</div>
              <div className="p-panel-header__title">
                {formMode === 'new'
                  ? 'Cadastrar nova ave'
                  : formMode === 'edit'
                    ? `Editando ${formData.Nome}`
                    : selected
                      ? selected.Nome
                      : 'Detalhes da ave'}
              </div>
              <p className="p-panel-header__subtitle">
                {formMode
                  ? 'Revise os dados com foco no manejo diário e mantenha o cadastro legível para toda a operação.'
                  : 'Selecione uma ave ao lado ou inicie um novo cadastro para visualizar a ficha completa.'}
              </p>
            </div>

            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {(formMode === 'new' || formMode === 'edit') && (
                <>
                  <button className="p-btn p-btn--primary" onClick={handleSubmit}>Salvar</button>
                  <button className="p-btn p-btn--secondary" onClick={handleCancel}>Cancelar</button>
                </>
              )}
              {formMode === 'view' && selected && (
                <>
                  <button className="p-btn p-btn--secondary" onClick={handleEdit}>Editar</button>
                  <button className="p-btn p-btn--danger" onClick={() => setDelTarget(selected)}>Excluir</button>
                </>
              )}
            </div>
          </div>

          {!formMode ? (
            <div className="p-panel-body module-empty">
              <div>
                <div style={{ fontSize: 42, marginBottom: 12 }}>Selecione uma ficha</div>
                <div style={{ lineHeight: 1.8, maxWidth: 520 }}>A visualização detalhada aparece aqui com status, origem, anel, mutação e observações para facilitar decisões rápidas no manejo.</div>
              </div>
            </div>
          ) : (
            <div className="p-panel-body">
              <div className="p-stats mb-3">
                <div className="module-panel" style={{ padding: '15px 16px' }}>
                  <div className="text-faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>Status atual</div>
                  <StatusBadge status={formData.Status || 'Vivo'} />
                </div>
                <div className="module-panel" style={{ padding: '15px 16px' }}>
                  <div className="text-faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>Localização</div>
                  <div className="font-serif" style={{ fontSize: 15 }}>{formData.Gaiola || 'Sem gaiola definida'}</div>
                </div>
                <div className="module-panel" style={{ padding: '15px 16px' }}>
                  <div className="text-faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>Origem</div>
                  <div className="font-serif" style={{ fontSize: 15 }}>{formData.Origem || 'Não informada'}</div>
                </div>
              </div>

              <div className="p-form-grid">
                {renderInput('Nome', 'Nome', { placeholder: 'Nome da ave' })}
                {renderInput('Status', 'Status', { type: 'dropdown', options: STATUS_OPTIONS })}
                {renderInput('NomeMae', 'Nome da mãe', { placeholder: 'Mãe' })}
                {renderInput('NomePai', 'Nome do pai', { placeholder: 'Pai' })}
                {renderInput('Gaiola', 'Gaiola', { type: 'dropdown', options: catalogs.gaiolas })}
                {renderInput('DataNascimento', 'Data de nascimento', { type: 'date' })}
                {renderInput('CategoriaAve', 'Espécie', { type: 'dropdown', options: catalogs.especies })}
                {renderInput('Genero', 'Gênero', { type: 'dropdown', options: GENERO_OPTIONS })}
                {renderInput('Origem', 'Criatório / origem', { type: 'dropdown', options: catalogs.criatorios })}
                {renderInput('RegistroFOB', 'Registro FOB', { placeholder: 'FOB-XXX' })}
                {renderInput('AnelEsquerdo', 'Anel esquerdo', { type: 'dropdown', options: catalogs.aneis })}
                {mutationOptionsForSpecies.length > 0
                  ? renderInput('Mutacao', 'Mutação', { type: 'dropdown', options: mutationOptionsForSpecies })
                  : null}
                {renderInput('observacao', 'Observações', { type: 'textarea', fullWidth: true, placeholder: 'Notas sobre comportamento, genética, saúde ou histórico recente...' })}
              </div>
            </div>
          )}
        </section>
      </div>

      {delTarget && (
        <ConfirmModal
          title="Remover ave do plantel?"
          message={`A ave "${delTarget.Nome}" será removida permanentemente. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar remoção"
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
