import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { speciesLookupService } from '../../../services/speciesLookup.service'
import { speciesService } from '../../../services/species.service'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_ESPECIES = [
  { ID: 1, Especie: 'Tarim', NomeCientifico: 'Spinus Cucullatus', Origem: 'O Pintassilgo-da-Venezuela ou Tarim (Spinus cucullatus) é um pequeno pássaro da família Fringillidae, originário da América do Sul tropical, do norte da Colômbia e da Venezuela.', Comentarios: 'O pintassilgo da Venezuela tem um comprimento de cerca de 10 cm. O macho apresenta o peito, a barriga, o dorso e o uropígio de um vermelho vivo. As asas são pretas com uma banda vermelha.', PeriodoReproducao: 'Abril a Junho, com segundo período de Novembro a Dezembro', TempoChoco: 13 },
  { ID: 2, Especie: 'canário belga', NomeCientifico: 'Serinus canaria domestica', Origem: 'Ave doméstica desenvolvida a partir do canário selvagem das Ilhas Canárias, Madeira e Açores, com seleção consolidada na canaricultura europeia.', Comentarios: 'Canário doméstico amplamente criado em ambiente controlado, com reprodução bem adaptada ao manejo em criatório.', PeriodoReproducao: 'Setembro a fevereiro', TempoChoco: 13 },
]

const EMPTY_FORM = { Especie: '', NomeCientifico: '', Origem: '', Comentarios: '', PeriodoReproducao: '', TempoChoco: '' }
const AUTO_FIELDS = ['NomeCientifico', 'Origem', 'Comentarios', 'PeriodoReproducao', 'TempoChoco']

function hasMissingDetails(form = {}) {
  return AUTO_FIELDS
    .some((field) => !String(form[field] || '').trim())
}

function mergeSuggestedData(current = {}, suggested = {}) {
  return {
    ...current,
    NomeCientifico: suggested.nomeCientifico || current.NomeCientifico || '',
    Origem: suggested.origem || current.Origem || '',
    Comentarios: suggested.comentarios || current.Comentarios || '',
    PeriodoReproducao: suggested.periodoReproducao || current.PeriodoReproducao || '',
    TempoChoco: suggested.tempoChoco ? String(suggested.tempoChoco) : (current.TempoChoco || ''),
  }
}

function resetAutoFields(form = {}, especie = '') {
  return {
    ...form,
    Especie: especie,
    NomeCientifico: '',
    Origem: '',
    Comentarios: '',
    PeriodoReproducao: '',
    TempoChoco: '',
  }
}

export function EspeciesModule() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM })
  const [delTarget, setDelTarget] = useState(null)
  const [error, setError] = useState('')
  const [lookup, setLookup] = useState({ loading: false, mode: '', message: '', error: '', sourceUrl: '' })

  const loadSpecies = async () => {
    try {
      const species = await speciesService.list()
      setData(species || [])
    } catch (_) {
      setError('Não foi possível carregar as espécies salvas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (USE_MOCK) {
      setTimeout(() => { setData(MOCK_ESPECIES); setLoading(false) }, 400)
    } else {
      loadSpecies()
    }
  }, [])

  useEffect(() => {
    if (selected) {
      setEditForm({
        Especie: selected.Especie,
        NomeCientifico: selected.NomeCientifico,
        Origem: selected.Origem,
        Comentarios: selected.Comentarios,
        PeriodoReproducao: selected.PeriodoReproducao,
        TempoChoco: selected.TempoChoco,
      })
      setIsAdding(false)
    }
  }, [selected])

  const handleSpeciesChange = (value, setForm) => {
    setLookup({ loading: false, mode: '', message: '', error: '', sourceUrl: '' })
    setForm((current) => resetAutoFields(current, value))
  }

  const handleLookup = async (mode, form, setForm, force = false) => {
    const query = String(form.Especie || '').trim()

    if (query.length < 3) {
      setLookup({
        loading: false,
        mode,
        message: '',
        error: 'Digite pelo menos 3 caracteres no nome da espécie para buscar na internet.',
        sourceUrl: '',
      })
      return
    }

    if (!force && !hasMissingDetails(form)) {
      return
    }

    setLookup({
      loading: true,
      mode,
      message: 'Buscando dados complementares na internet...',
      error: '',
      sourceUrl: '',
    })

    try {
      const response = await speciesLookupService.enrich(query)
      setForm((current) => mergeSuggestedData(current, response.suggested || {}))
      setLookup({
        loading: false,
        mode,
        message: 'Ficha complementada automaticamente com os dados encontrados.',
        error: '',
        sourceUrl: response.metadata?.wikipediaUrl || '',
      })
    } catch (requestError) {
      setLookup({
        loading: false,
        mode,
        message: '',
        error: requestError.response?.data?.message || 'Não foi possível buscar dados complementares agora.',
        sourceUrl: '',
      })
    }
  }

  useEffect(() => {
    if (!isAdding || !newForm.Especie.trim() || !hasMissingDetails(newForm)) return undefined

    const timeout = setTimeout(() => {
      handleLookup('new', newForm, setNewForm)
    }, 900)

    return () => clearTimeout(timeout)
  }, [isAdding, newForm.Especie])

  useEffect(() => {
    if (!selected || !editForm?.Especie?.trim() || !hasMissingDetails(editForm)) return undefined

    const timeout = setTimeout(() => {
      handleLookup('edit', editForm, setEditForm)
    }, 900)

    return () => clearTimeout(timeout)
  }, [selected, editForm?.Especie])

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editForm.Especie.trim() || !editForm.NomeCientifico.trim()) { setError('Espécie e Nome Científico são obrigatórios.'); return }
    if (USE_MOCK) {
      setData(prev => prev.map(r => r.ID === selected.ID ? { ...r, ...editForm, TempoChoco: Number(editForm.TempoChoco) || 0 } : r))
      setSelected({ ...selected, ...editForm, TempoChoco: Number(editForm.TempoChoco) || 0 })
      setError('')
      return
    }

    try {
      const response = await speciesService.update(selected.ID, editForm)
      setData(response.items || [])
      setSelected(response.item || null)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível salvar as alterações da espécie.')
    }
  }

  const handleAddNew = async () => {
    if (!newForm.Especie.trim() || !newForm.NomeCientifico.trim()) { setError('Espécie e Nome Científico são obrigatórios.'); return }
    if (USE_MOCK) {
      const novo = { ID: Date.now(), ...newForm, TempoChoco: Number(newForm.TempoChoco) || 0 }
      setData(prev => [...prev, novo])
      setNewForm({ ...EMPTY_FORM })
      setIsAdding(false)
      setError('')
      return
    }

    try {
      const response = await speciesService.create(newForm)
      setData(response.items || [])
      setSelected(response.item || null)
      setNewForm({ ...EMPTY_FORM })
      setIsAdding(false)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível salvar a nova espécie.')
    }
  }

  const handleDelete = async () => {
    if (USE_MOCK) {
      setData(prev => prev.filter(r => r.ID !== delTarget.ID))
      if (selected?.ID === delTarget.ID) { setSelected(null); setEditForm(null) }
      setDelTarget(null)
      return
    }

    try {
      const response = await speciesService.remove(delTarget.ID)
      setData(response.items || [])
      if (selected?.ID === delTarget.ID) { setSelected(null); setEditForm(null) }
      setDelTarget(null)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível remover a espécie.')
    }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.Especie, r.NomeCientifico].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: data.length,
    tempoMedioChoco: data.length > 0 ? (data.reduce((sum, r) => sum + (r.TempoChoco || 0), 0) / data.length).toFixed(1) : 0,
  }

  if (loading) return (
    <div className="flex items-center justify-center text-muted" style={{ height: '50vh', fontSize: 13 }}>
      Carregando espécies...
    </div>
  )

  // ─── Formulário reutilizável ──────────────────────────────────────────────
  const renderForm = (form, setForm, mode) => (
    <div className="flex-col gap-2">
      <div className="p-field">
        <label className="p-label">Espécie</label>
        <input className="p-input" value={form.Especie} onChange={e => handleSpeciesChange(e.target.value, setForm)} placeholder="Nome da espécie" />
        <div className="flex items-center justify-between gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
          <div className="text-faint" style={{ fontSize: 11 }}>
            Ao digitar a espécie, o sistema tenta buscar nome científico e dados biológicos na internet.
          </div>
          <button
            type="button"
            onClick={() => handleLookup(mode, form, setForm, true)}
            className="p-btn p-btn--secondary"
          >
            {lookup.loading && lookup.mode === mode ? 'Buscando...' : 'Complementar ficha'}
          </button>
        </div>
        {lookup.mode === mode && lookup.message && (
          <div className="text-faint mt-1" style={{ fontSize: 11, lineHeight: 1.6 }}>
            {lookup.message}
            {lookup.sourceUrl ? (
              <>
                {' '}Fonte: <a href={lookup.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#C95025' }}>Wikipedia</a>
              </>
            ) : null}
          </div>
        )}
        {lookup.mode === mode && lookup.error && (
          <div className="mt-1" style={{ fontSize: 11, color: '#E05C4B', lineHeight: 1.6 }}>
            {lookup.error}
          </div>
        )}
      </div>
      <div className="p-field">
        <label className="p-label">Nome Científico</label>
        <input className="p-input" value={form.NomeCientifico} onChange={e => setForm(f => ({ ...f, NomeCientifico: e.target.value }))} placeholder="Nome científico" />
      </div>
      <div className="p-field">
        <label className="p-label">Origem</label>
        <textarea className="p-textarea" value={form.Origem} onChange={e => setForm(f => ({ ...f, Origem: e.target.value }))} placeholder="Região de origem" />
      </div>
      <div className="p-field">
        <label className="p-label">Comentários</label>
        <textarea className="p-textarea" value={form.Comentarios} onChange={e => setForm(f => ({ ...f, Comentarios: e.target.value }))} placeholder="Observações gerais" />
      </div>
      <div className="p-form-grid">
        <div className="p-field">
          <label className="p-label">Período de Reprodução</label>
          <input className="p-input" value={form.PeriodoReproducao} onChange={e => setForm(f => ({ ...f, PeriodoReproducao: e.target.value }))} placeholder="Ex: Março a Julho" />
        </div>
        <div className="p-field">
          <label className="p-label">Tempo de Choco (dias)</label>
          <input className="p-input" type="number" value={form.TempoChoco} onChange={e => setForm(f => ({ ...f, TempoChoco: e.target.value }))} placeholder="14" />
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Catálogo biológico</div>
          <h2 className="module-hero__title">Espécies do criatório</h2>
          <div className="module-hero__text">
            Centralize dados científicos, origem, período reprodutivo e tempo de choco para dar consistência a todo o restante do sistema.
          </div>
        </div>
        <div className="pill">Base técnica</div>
      </div>

      {error && (
        <div className="p-alert--error">
          {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}>x</span>
        </div>
      )}

      {/* Stats */}
      <div className="p-stats mb-3">
        <StatCard label="Total Espécies" value={stats.total} desc="espécies catalogadas" color="#C95025" />
        <StatCard label="Tempo Médio Choco" value={`${stats.tempoMedioChoco}d`} desc="dias em média" color="#F5A623" />
        <StatCard label="Catálogo" value={data.length > 0 ? 'Ativo' : 'Vazio'} desc="status do catálogo" color="#4CAF7D" />
      </div>

      {/* Master-Detail Layout */}
      <div className="p-split">

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div className="module-panel">
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Detalhe Espécies</div>
              <div className="p-panel-header__subtitle">
                {filtered.length} de {data.length} registros
              </div>
            </div>
            <button className="p-btn p-btn--primary" onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }}>
              + Nova Espécie
            </button>
          </div>

          {/* Search */}
          <div className="p-panel-search">
            <input
              className="p-search"
              placeholder="Buscar espécie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div className="p-panel-list">
            {filtered.length === 0 ? (
              <div className="module-empty">
                <div className="text-muted" style={{ fontSize: 14 }}>Nenhuma espécie encontrada</div>
              </div>
            ) : filtered.map(r => (
              <div
                key={r.ID}
                className={`p-list-item ${selected?.ID === r.ID ? 'is-active' : ''}`}
                onClick={() => setSelected(r)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif" style={{ fontSize: 16, fontWeight: 700 }}>
                      {r.Especie}
                    </div>
                    <div className="text-faint" style={{ fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>
                      {r.NomeCientifico}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                      Choco: {r.TempoChoco} dias | {r.PeriodoReproducao}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDelTarget(r) }}
                    className="p-btn p-btn--ghost p-btn--sm"
                    style={{ color: '#E05C4B', opacity: 0.5 }}
                    title="Remover"
                  >x</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT PANEL: Detail Form ═══ */}
        <div className="module-panel">
          {isAdding ? (
            <div className="p-panel-body">
              <div className="p-panel-header__title mb-2" style={{ fontSize: 22 }}>
                Nova Espécie
              </div>
              {renderForm(newForm, setNewForm, 'new')}
              <div className="flex gap-1 mt-2">
                <button className="p-btn p-btn--primary" onClick={handleAddNew}>Salvar</button>
                <button className="p-btn p-btn--secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
              </div>
            </div>
          ) : selected && editForm ? (
            <div className="p-panel-body">
              <div className="p-panel-header__title" style={{ fontSize: 22 }}>
                {selected.Especie} - {selected.NomeCientifico}
              </div>
              <div className="text-muted mb-2" style={{ fontSize: 12 }}>
                Editar informações da espécie
              </div>
              {renderForm(editForm, setEditForm, 'edit')}
              <div className="flex gap-1 mt-2">
                <button className="p-btn p-btn--primary" onClick={handleSaveEdit}>Salvar Alterações</button>
              </div>
            </div>
          ) : (
            <div className="module-empty">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  Selecione uma espécie ao lado para<br />visualizar e editar detalhes
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {delTarget && (
        <ConfirmModal
          title="Remover espécie?"
          message={`A espécie "${delTarget.Especie}" será removida do catálogo. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
