import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { plantelService } from '../../../services/plantel.service'
import { accessService } from '../../../services/access.service'

const MOCK_PLANTEL = [
  { ID: 1, Nome: 'Thor', Status: 'Vivo', NomeMae: 'Luna', NomePai: 'Zeus', Gaiola: 'G-01', DataNascimento: '2024-08-15', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criadouro Marbella', RegistroFOB: 'FOB-001', AnelEsquerdo: 'AZ-2024-001', Mutacao: 'Ancestral', Acesso: 'Anderson', observacao: '' },
  { ID: 2, Nome: 'Athena', Status: 'Vivo', NomeMae: 'Hera', NomePai: 'Thor', Gaiola: 'G-02', DataNascimento: '2025-01-10', CategoriaAve: 'Tarin', Genero: 'Femea', Origem: 'Criadouro Próprio', RegistroFOB: 'FOB-002', AnelEsquerdo: 'AZ-2024-002', Mutacao: 'Canela', Acesso: 'Anderson', observacao: '' },
  { ID: 3, Nome: 'Apollo', Status: 'Vivo', NomeMae: 'Luna', NomePai: 'Zeus', Gaiola: 'G-03', DataNascimento: '2024-11-20', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criadouro Marbella', RegistroFOB: 'FOB-003', AnelEsquerdo: 'AZ-2024-003', Mutacao: 'Pastel', Acesso: 'Anderson', observacao: 'Excelente reprodutor' },
  { ID: 4, Nome: 'Diana', Status: 'Vivo', NomeMae: 'Athena', NomePai: 'Apollo', Gaiola: 'G-01', DataNascimento: '2025-06-05', CategoriaAve: 'Tarin', Genero: 'Femea', Origem: 'Criadouro Próprio', RegistroFOB: '', AnelEsquerdo: '', Mutacao: 'Canela Pastel', Acesso: 'Anderson', observacao: '' },
  { ID: 5, Nome: 'Hermes', Status: 'Vivo', NomeMae: 'Athena', NomePai: 'Thor', Gaiola: 'G-04', DataNascimento: '2025-09-12', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criadouro Próprio', RegistroFOB: 'FOB-005', AnelEsquerdo: 'AZ-2025-001', Mutacao: 'Diluído', Acesso: 'Anderson', observacao: '' },
]

const MOCK_ESPECIES = [{ Especie: 'Tarin' }, { Especie: 'Canário' }, { Especie: 'Pintassilgo' }]
const MOCK_GAIOLAS = [{ NumeroGaiola: 'G-01' }, { NumeroGaiola: 'G-02' }, { NumeroGaiola: 'G-03' }, { NumeroGaiola: 'G-04' }, { NumeroGaiola: 'G-05' }]
const MOCK_CRIATORIOS = [{ NomeCriatorio: 'Criadouro Marbella' }, { NomeCriatorio: 'Criadouro Próprio' }, { NomeCriatorio: 'Criadouro Saragoça' }]
const MOCK_ANEIS = [{ NumeroAnel: 'AZ-2024-001' }, { NumeroAnel: 'AZ-2024-002' }, { NumeroAnel: 'AZ-2024-003' }, { NumeroAnel: 'AZ-2025-001' }]
const MOCK_MUTACOES = ['Ancestral', 'Canela', 'Pastel', 'Canela Pastel', 'Topázio', 'Diluído', 'Duplo Diluído']

const STATUS_OPTIONS = ['Vivo', 'Filhote', 'Falecimento', 'Vendido', 'Doado']
const GENERO_OPTIONS = ['Macho', 'Femea']
const USE_MOCK = !import.meta.env.VITE_API_URL

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 22 },
  error: { background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 16, padding: '12px 16px', color: '#E05C4B', fontSize: 13 },
  eyebrow: { fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 24, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", lineHeight: 1.1, marginBottom: 8 },
  text: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 },
  searchRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 18, flexWrap: 'wrap' },
  searchInput: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 14px', color: 'var(--text-main)', fontSize: 13, outline: 'none' },
  addBtn: { background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none', borderRadius: 14, padding: '0 16px', minWidth: 116, height: 46, color: '#fff7f2', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 12px 24px rgba(201,80,37,0.24)', flexShrink: 0 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 16 },
  quickCard: { padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' },
  quickLabel: { fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 },
  quickValue: { fontSize: 16, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" },
  itemTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg, rgba(201,80,37,0.25), rgba(255,255,255,0.04))', border: '1px solid rgba(201,80,37,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd8cb', fontSize: 15, fontWeight: 700, flexShrink: 0 },
  itemName: { fontSize: 18, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 4 },
  itemMeta: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 },
  itemFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' },
  subtleText: { fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  toolbarRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  toolbarTitle: { fontSize: 28, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", lineHeight: 1.05 },
  toolbarSubtitle: { marginTop: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },
  toolbarBtns: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  primaryBtn: { borderRadius: 14, border: '1px solid rgba(76,175,125,0.28)', background: 'rgba(76,175,125,0.12)', color: '#d6f5e6', padding: '12px 16px', cursor: 'pointer', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' },
  neutralBtn: { borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-soft)', padding: '12px 16px', cursor: 'pointer', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' },
  accentBtn: { borderRadius: 14, border: '1px solid rgba(201,80,37,0.22)', background: 'rgba(201,80,37,0.12)', color: '#ffd4c7', padding: '12px 16px', cursor: 'pointer', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' },
  dangerBtn: { borderRadius: 14, border: '1px solid rgba(224,92,75,0.2)', background: 'rgba(224,92,75,0.12)', color: '#ffc9c1', padding: '12px 16px', cursor: 'pointer', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' },
  summaryCard: { padding: '15px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' },
  summaryLabel: { fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 },
  summaryValue: { fontSize: 15, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 7 },
  fieldWrapFull: { display: 'flex', flexDirection: 'column', gap: 7, gridColumn: '1 / -1' },
  label: { fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' },
  input: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 14px', color: 'var(--text-main)', fontSize: 13, outline: 'none' },
  inputDisabled: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '13px 14px', color: 'var(--text-faint)', fontSize: 13, outline: 'none', cursor: 'not-allowed' },
  textarea: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 14px', color: 'var(--text-main)', fontSize: 13, minHeight: 100, resize: 'vertical', outline: 'none' },
  textareaDisabled: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '13px 14px', color: 'var(--text-faint)', fontSize: 13, minHeight: 100, resize: 'vertical', outline: 'none', cursor: 'not-allowed' },
  select: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 14px', color: 'var(--text-main)', fontSize: 13, outline: 'none', appearance: 'none', WebkitAppearance: 'none' },
  selectDisabled: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '13px 14px', color: 'var(--text-faint)', fontSize: 13, outline: 'none', cursor: 'not-allowed', appearance: 'none', WebkitAppearance: 'none' },
  emptyState: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360, textAlign: 'center', color: 'var(--text-muted)', padding: '24px 16px' },
}

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
    const wrapStyle = fullWidth ? S.fieldWrapFull : S.fieldWrap

    if (type === 'dropdown') {
      const onChange = key === 'CategoriaAve'
        ? (event) => setSpecies(event.target.value)
        : (event) => setField(key, event.target.value)

      return (
        <div style={wrapStyle} key={key}>
          <label style={S.label}>{label}</label>
          <select style={editable ? S.select : S.selectDisabled} value={formData[key] || ''} onChange={onChange} disabled={!editable}>
            <option value="">Selecionar</option>
            {(options || []).map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      )
    }

    if (type === 'date') {
      if (isNewMode) {
        return (
          <div style={wrapStyle} key={key}>
            <label style={S.label}>{label}</label>
            <input type="date" style={S.input} value={formData[key] || ''} onChange={(e) => setField(key, e.target.value)} />
          </div>
        )
      }

      return (
        <div style={wrapStyle} key={key}>
          <label style={S.label}>{label}</label>
          <input style={S.inputDisabled} value={formData[key] || ''} disabled readOnly />
        </div>
      )
    }

    if (type === 'textarea') {
      return (
        <div style={wrapStyle} key={key}>
          <label style={S.label}>{label}</label>
          <textarea style={editable ? S.textarea : S.textareaDisabled} value={formData[key] || ''} onChange={(e) => setField(key, e.target.value)} disabled={!editable} placeholder={placeholder || ''} />
        </div>
      )
    }

    return (
      <div style={wrapStyle} key={key}>
        <label style={S.label}>{label}</label>
        <input style={editable ? S.input : S.inputDisabled} value={formData[key] || ''} onChange={(e) => setField(key, e.target.value)} disabled={!editable} placeholder={placeholder || ''} />
      </div>
    )
  }

  if (loading) {
    return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Carregando plantel...</div>
  }

  return (
    <div className="page-block" style={S.page}>
      {error && <div style={S.error}>{error}</div>}

      <div className="stat-grid">
        <StatCard label="Total vivos" value={stats.total} desc="aves ativas no plantel" color="#C95025" />
        <StatCard label="Machos" value={stats.machos} desc="reprodutores disponíveis" color="#4CAF7D" />
        <StatCard label="Fêmeas" value={stats.femeas} desc="matrizes em acompanhamento" color="#F5A623" />
        <StatCard label="Gaiolas" value={stats.gaiolas} desc="ocupações distintas mapeadas" color="#5BC0EB" />
      </div>

      <div className="plantel-master">
        <section className="plantel-column plantel-gallery">
          <div className="plantel-gallery__header">
            <div style={S.eyebrow}>Painel vivo</div>
            <div style={S.title}>Consulta rápida do plantel</div>
            <div style={S.text}>Busque uma ave, abra a ficha e faça ajustes sem perder o contexto do restante do plantel.</div>

            <div style={S.searchRow}>
              <input
                style={S.searchInput}
                placeholder="Buscar por nome da ave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(201,80,37,0.4)' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
              <button style={S.addBtn} onClick={handleNew}>Nova ave</button>
            </div>

            <div style={S.quickGrid}>
              <div style={S.quickCard}>
                <div style={S.quickLabel}>Filtradas</div>
                <div style={S.quickValue}>{filtered.length}</div>
              </div>
              <div style={S.quickCard}>
                <div style={S.quickLabel}>Origens</div>
                <div style={S.quickValue}>{new Set(vivosOnly.map((item) => item.Origem)).size}</div>
              </div>
              <div style={S.quickCard}>
                <div style={S.quickLabel}>Mutações</div>
                <div style={S.quickValue}>{new Set(vivosOnly.map((item) => item.Mutacao)).size}</div>
              </div>
            </div>
          </div>

          <div className="plantel-gallery__list">
            {filtered.length === 0 ? (
              <div style={S.emptyState}>
                <div>
                  <div style={{ fontSize: 38, marginBottom: 12 }}>Sem resultados</div>
                  <div style={{ lineHeight: 1.7 }}>Ajuste a busca ou crie uma nova ave para alimentar o plantel.</div>
                </div>
              </div>
            ) : (
              filtered.map((ave) => (
                <button key={ave.ID} type="button" className={`plantel-item${selected?.ID === ave.ID ? ' plantel-item--active' : ''}`} onClick={() => handleSelect(ave)} style={{ textAlign: 'left' }}>
                  <div style={S.itemTop}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={S.avatar}>{ave.Nome.slice(0, 1).toUpperCase()}</div>
                      <div>
                        <div style={S.itemName}>{ave.Nome}</div>
                        <div style={S.itemMeta}>{ave.CategoriaAve} · {ave.Genero} · {ave.Gaiola || 'Sem gaiola'}</div>
                      </div>
                    </div>
                  </div>

                  <div style={S.itemFooter}>
                    <StatusBadge status={ave.Status} />
                    <span style={S.subtleText}>{ave.Mutacao || 'Sem mutação'} · {ave.AnelEsquerdo || 'Sem anel'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="plantel-column plantel-form">
          <div className="plantel-form__header">
            <div style={S.toolbarRow}>
              <div>
                <div style={S.eyebrow}>Ficha operacional</div>
                <div style={S.toolbarTitle}>
                  {formMode === 'new'
                    ? 'Cadastrar nova ave'
                    : formMode === 'edit'
                      ? `Editando ${formData.Nome}`
                      : selected
                        ? selected.Nome
                        : 'Detalhes da ave'}
                </div>
                <div style={S.toolbarSubtitle}>
                  {formMode
                    ? 'Revise os dados com foco no manejo diário e mantenha o cadastro legível para toda a operação.'
                    : 'Selecione uma ave ao lado ou inicie um novo cadastro para visualizar a ficha completa.'}
                </div>
              </div>

              <div style={S.toolbarBtns}>
                {(formMode === 'new' || formMode === 'edit') && (
                  <>
                    <button style={S.primaryBtn} onClick={handleSubmit}>Salvar</button>
                    <button style={S.neutralBtn} onClick={handleCancel}>Cancelar</button>
                  </>
                )}
                {formMode === 'view' && selected && (
                  <>
                    <button style={S.accentBtn} onClick={handleEdit}>Editar</button>
                    <button style={S.dangerBtn} onClick={() => setDelTarget(selected)}>Excluir</button>
                  </>
                )}
              </div>
            </div>
          </div>

          {!formMode ? (
            <div className="plantel-form__body" style={S.emptyState}>
              <div>
                <div style={{ fontSize: 42, marginBottom: 12 }}>Selecione uma ficha</div>
                <div style={{ lineHeight: 1.8, maxWidth: 520 }}>A visualização detalhada aparece aqui com status, origem, anel, mutação e observações para facilitar decisões rápidas no manejo.</div>
              </div>
            </div>
          ) : (
            <div className="plantel-form__body">
              <div className="plantel-summary">
                <div style={S.summaryCard}>
                  <div style={S.summaryLabel}>Status atual</div>
                  <StatusBadge status={formData.Status || 'Vivo'} />
                </div>
                <div style={S.summaryCard}>
                  <div style={S.summaryLabel}>Localização</div>
                  <div style={S.summaryValue}>{formData.Gaiola || 'Sem gaiola definida'}</div>
                </div>
                <div style={S.summaryCard}>
                  <div style={S.summaryLabel}>Origem</div>
                  <div style={S.summaryValue}>{formData.Origem || 'Não informada'}</div>
                </div>
              </div>

              <div className="plantel-form-grid">
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
