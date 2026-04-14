import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { StatusBadge }   from '../../shared/StatusBadge'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { plantelService } from '../../../services/plantel.service'
import { accessService } from '../../../services/access.service'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK_ALL = [
  { ID: 1, Nome: 'Thor', Status: 'Vivo', NomeMae: 'Luna', NomePai: 'Zeus', Gaiola: 'G-01', DataNascimento: '2024-08-15', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criadouro Marbella', RegistroFOB: 'FOB-001', AnelEsquerdo: 'AZ-2024-001', Mutacao: 'Ancestral', Acesso: 'Anderson', observacao: '' },
  { ID: 2, Nome: 'Athena', Status: 'Vivo', NomeMae: 'Hera', NomePai: 'Thor', Gaiola: 'G-02', DataNascimento: '2025-01-10', CategoriaAve: 'Tarin', Genero: 'Femea', Origem: 'Criadouro Próprio', RegistroFOB: 'FOB-002', AnelEsquerdo: 'AZ-2024-002', Mutacao: 'Canela', Acesso: 'Anderson', observacao: '' },
  { ID: 3, Nome: 'Apollo', Status: 'Vivo', NomeMae: 'Luna', NomePai: 'Zeus', Gaiola: 'G-03', DataNascimento: '2024-11-20', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criadouro Marbella', RegistroFOB: 'FOB-003', AnelEsquerdo: 'AZ-2024-003', Mutacao: 'Pastel', Acesso: 'Anderson', observacao: 'Excelente reprodutor' },
  { ID: 4, Nome: 'Diana', Status: 'Vivo', NomeMae: 'Athena', NomePai: 'Apollo', Gaiola: 'G-01', DataNascimento: '2025-06-05', CategoriaAve: 'Tarin', Genero: 'Femea', Origem: 'Criadouro Próprio', RegistroFOB: '', AnelEsquerdo: '', Mutacao: 'Canela Pastel', Acesso: 'Anderson', observacao: '' },
  { ID: 5, Nome: 'Hermes', Status: 'Vivo', NomeMae: 'Athena', NomePai: 'Thor', Gaiola: 'G-04', DataNascimento: '2025-09-12', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criadouro Próprio', RegistroFOB: 'FOB-005', AnelEsquerdo: 'AZ-2025-001', Mutacao: 'Diluído', Acesso: 'Anderson', observacao: '' },
  { ID: 6, Nome: 'Ares', Status: 'Falecimento', NomeMae: 'Luna', NomePai: 'Zeus', Gaiola: '', DataNascimento: '2023-05-10', CategoriaAve: 'Tarin', Genero: 'Macho', Origem: 'Criadouro Marbella', RegistroFOB: 'FOB-006', AnelEsquerdo: 'AZ-2023-001', Mutacao: 'Ancestral', Acesso: 'Anderson', observacao: 'Faleceu em 2025-02-01' },
  { ID: 7, Nome: 'Perséfone', Status: 'Vendido', NomeMae: 'Hera', NomePai: 'Thor', Gaiola: '', DataNascimento: '2024-03-22', CategoriaAve: 'Tarin', Genero: 'Femea', Origem: 'Criadouro Próprio', RegistroFOB: 'FOB-007', AnelEsquerdo: 'AZ-2024-004', Mutacao: 'Pastel', Acesso: 'Anderson', observacao: 'Vendido para Criadouro Saragoça' },
]

const MOCK_ESPECIES = [{ Especie: 'Tarin' }, { Especie: 'Canário' }, { Especie: 'Pintassilgo' }]
const MOCK_GAIOLAS = [{ NumeroGaiola: 'G-01' }, { NumeroGaiola: 'G-02' }, { NumeroGaiola: 'G-03' }, { NumeroGaiola: 'G-04' }, { NumeroGaiola: 'G-05' }]
const MOCK_CRIATORIOS = [{ NomeCriatorio: 'Criadouro Marbella' }, { NomeCriatorio: 'Criadouro Próprio' }, { NomeCriatorio: 'Criadouro Saragoça' }]
const MOCK_ANEIS = [{ NumeroAnel: 'AZ-2024-001' }, { NumeroAnel: 'AZ-2024-002' }, { NumeroAnel: 'AZ-2024-003' }, { NumeroAnel: 'AZ-2025-001' }, { NumeroAnel: 'AZ-2024-004' }, { NumeroAnel: 'AZ-2023-001' }]
const MOCK_MUTACOES = ['Ancestral', 'Canela', 'Pastel', 'Canela Pastel', 'Topázio', 'Diluído', 'Duplo Diluído']

const STATUS_OPTIONS = ['Vivo', 'Filhote', 'Falecimento', 'Vendido', 'Doado']
const GENERO_OPTIONS = ['Macho', 'Femea']

const USE_MOCK = !import.meta.env.VITE_API_URL

// ─── Estilos ────────────────────────────────────────────────────────────────
const S = {
  page:       { display: 'flex', flexDirection: 'column', height: '100%', gap: 20 },
  master:     { display: 'flex', gap: 0, flex: 1, minHeight: 0, overflow: 'hidden' },
  gallery:    { width: '35%', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', minHeight: 0 },
  formPanel:  { width: '65%', display: 'flex', flexDirection: 'column', minHeight: 0 },
  galleryHeader: { padding: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12 },
  searchRow:  { display: 'flex', gap: 8, alignItems: 'center' },
  searchInput:{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 12, fontFamily: 'inherit', outline: 'none' },
  addBtn:     { background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none', borderRadius: 14, width: 42, height: 42, color: '#FFFFFF', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  galleryList:{ flex: 1, overflowY: 'auto', overflowX: 'hidden' },
  galleryItem:{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' },
  galleryItemSelected: { background: 'linear-gradient(135deg, rgba(201,80,37,0.12), rgba(255,255,255,0.04))' },
  galleryName:{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 3 },
  gallerySub: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 6 },
  toolbar:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(21,40,24,0.2)' },
  toolbarTitle:{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" },
  toolbarBtns:{ display: 'flex', gap: 8 },
  iconBtn:    (color) => ({ background: 'transparent', border: `1px solid ${color}33`, borderRadius: 14, width: 40, height: 40, color, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }),
  formBody:   { flex: 1, overflowY: 'auto', padding: '22px 26px' },
  formGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' },
  fieldWrap:  { display: 'flex', flexDirection: 'column', gap: 5 },
  fieldWrapFull: { display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' },
  label:      { fontSize: 11, fontFamily: 'inherit', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input:      { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none' },
  inputDisabled:{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'not-allowed' },
  select:     { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none' },
  selectDisabled:{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'not-allowed', appearance: 'none', WebkitAppearance: 'none' },
  textarea:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 88 },
  textareaDisabled: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 88, cursor: 'not-allowed' },
  emptyForm:  { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-faint)', fontFamily: 'inherit', fontSize: 13, flexDirection: 'column', gap: 8 },
  error:      { background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, color: '#E05C4B', fontSize: 13, fontFamily: 'inherit' },
}

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
    const wrapStyle = fullWidth ? S.fieldWrapFull : S.fieldWrap

    if (type === 'dropdown') {
      return (
        <div style={wrapStyle} key={key}>
          <label style={S.label}>{label}</label>
          <select
            style={editable ? S.select : S.selectDisabled}
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
          <div style={wrapStyle} key={key}>
            <label style={S.label}>{label}</label>
            <input
              type="date"
              style={S.input}
              value={formData[key] || ''}
              onChange={e => setField(key, e.target.value)}
            />
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
          <textarea
            style={editable ? S.textarea : S.textareaDisabled}
            value={formData[key] || ''}
            onChange={e => setField(key, e.target.value)}
            disabled={!editable}
            placeholder={placeholder || ''}
          />
        </div>
      )
    }

    return (
      <div style={wrapStyle} key={key}>
        <label style={S.label}>{label}</label>
        <input
          style={editable ? S.input : S.inputDisabled}
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
      Carregando ex-plantel...
    </div>
  )

  return (
    <div style={S.page}>
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

      {error && <div style={S.error}>{error}</div>}

      {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <StatCard label="Total Ex-Plantel" value={stats.total}       desc="aves desligadas"       color="#C95025" />
        <StatCard label="Falecimento"      value={stats.falecimento} desc="falecimentos"           color="#E05C4B" />
        <StatCard label="Vendidos"         value={stats.vendidos}    desc="aves vendidas"           color="#F5A623" />
        <StatCard label="Doados"           value={stats.doados}      desc="aves doadas"             color="#9B8EC4" />
      </div>

      {/* Master-Detail */}
      <div className="module-panel" style={S.master}>
        {/* ── LEFT: Gallery ───────────────────────────────────────────────── */}
        <div style={S.gallery}>
          <div style={S.galleryHeader}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
              Ex-Plantel
            </div>
            <div style={S.searchRow}>
              <input
                style={S.searchInput}
                placeholder="Buscar por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(201,80,37,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <button style={S.addBtn} onClick={handleNew} title="Novo registro">+</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
              {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
            </div>
          </div>

          <div style={S.galleryList}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 12, fontFamily: 'inherit', color: 'var(--text-muted)' }}>Nenhum registro encontrado</div>
              </div>
            ) : (
              filtered.map(ave => (
                <div
                  key={ave.ID}
                  style={{
                    ...S.galleryItem,
                    ...(selected?.ID === ave.ID ? S.galleryItemSelected : {}),
                    borderLeft: selected?.ID === ave.ID ? '3px solid #C95025' : '3px solid transparent',
                  }}
                  onClick={() => handleSelect(ave)}
                  onMouseEnter={e => { if (selected?.ID !== ave.ID) e.currentTarget.style.background = 'rgba(201,80,37,0.04)' }}
                  onMouseLeave={e => { if (selected?.ID !== ave.ID) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={S.galleryName}>{ave.Nome}</div>
                  <div style={S.gallerySub}>{ave.CategoriaAve} &middot; {ave.Genero}</div>
                  <StatusBadge status={ave.Status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Form ─────────────────────────────────────────────────── */}
        <div style={S.formPanel}>
          {/* Toolbar */}
          <div style={S.toolbar}>
            <div style={S.toolbarTitle}>
              {formMode === 'new' ? 'Novo Registro' : formMode === 'edit' ? `Editando: ${formData.Nome}` : selected ? selected.Nome : 'Detalhes'}
            </div>
            <div style={S.toolbarBtns}>
              {(formMode === 'new' || formMode === 'edit') && (
                <>
                  <button style={S.iconBtn('#4CAF7D')} onClick={handleSubmit} title="Salvar">💾</button>
                  <button style={S.iconBtn('#8A9E8C')} onClick={handleCancel} title="Cancelar">✕</button>
                </>
              )}
              {formMode === 'view' && selected && (
                <>
                  <button style={S.iconBtn('#C95025')} onClick={handleEdit} title="Editar">✏️</button>
                  <button style={S.iconBtn('#E05C4B')} onClick={() => setDelTarget(selected)} title="Excluir">🗑️</button>
                </>
              )}
            </div>
          </div>

          {/* Form Content */}
          {!formMode ? (
            <div style={S.emptyForm}>
              <div style={{ fontSize: 36, opacity: 0.4 }}>📋</div>
              <div>Selecione um registro ou clique + para cadastrar</div>
            </div>
          ) : (
            <div style={S.formBody}>
              <div style={S.formGrid}>
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
