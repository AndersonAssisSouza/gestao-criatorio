import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { accessService } from '../../../services/access.service'
import { gaiolasService } from '../../../services/gaiolas.service'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_GAIOLAS = [
  { ID: 1, NumeroGaiola: '001', Status: 'Chocando' },
  { ID: 4, NumeroGaiola: '002', Status: 'Com Ave Avulsa' },
  { ID: 5, NumeroGaiola: '003', Status: 'Dividida' },
]

const MOCK_PLANTEL_IN_CAGE = [
  { ID: 4, Nome: 'Manchinha', Status: 'Vivo', DataNascimento: '10/08/2023', Mutacao: 'Canela Pastel', Gaiola: '001', Genero: 'Fêmea', CategoriaAve: 'Tarin' },
  { ID: 9, Nome: 'Pardinho', Status: 'Vivo', DataNascimento: '10/08/2023', Mutacao: 'Duplo Diluído', Gaiola: '001', Genero: 'Macho', CategoriaAve: 'Tarin' },
  { ID: 8, Nome: 'Hulk', Status: 'Vivo', DataNascimento: '', Mutacao: 'Canela', Gaiola: '002', Genero: 'Macho', CategoriaAve: 'Tarin' },
  { ID: 10, Nome: 'Bandite', Status: 'Vivo', DataNascimento: '', Mutacao: '', Gaiola: '003', Genero: 'Macho', CategoriaAve: 'canário belga' },
  { ID: 11, Nome: 'Pardinha', Status: 'Vivo', DataNascimento: '2025-11-18', Mutacao: 'Canela Pastel', Gaiola: '003', Genero: 'Femea', CategoriaAve: 'Tarin' },
]

const STATUS_OPTIONS = ['Chocando', 'Vazia', 'Preparacao', 'Dividida', 'Com Ave Avulsa', 'Com Duas Aves Separadas', 'Acasalando']

function mapPlantelRecord(record) {
  return {
    ID: record.id,
    Nome: record.nome,
    Status: record.status,
    DataNascimento: record.dataNascimento,
    Mutacao: record.mutacao,
    Gaiola: record.gaiola,
    Genero: record.genero,
    CategoriaAve: record.categoriaAve,
  }
}

function isAliveBird(record = {}) {
  return String(record.Status || '')
    .trim()
    .toLowerCase() === 'vivo'
}

export function GaiolasModule() {
  const [gaiolas, setGaiolas] = useState([])
  const [plantel, setPlantel] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newForm, setNewForm] = useState({ NumeroGaiola: '', Status: 'Vazia' })
  const [delTarget, setDelTarget] = useState(null)
  const [error, setError] = useState('')

  // ─── Carregamento inicial ─────────────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK) {
      setTimeout(() => {
        setGaiolas(MOCK_GAIOLAS)
        setPlantel(MOCK_PLANTEL_IN_CAGE)
        setLoading(false)
      }, 400)
    } else {
      Promise.all([
        gaiolasService.listar(),
        accessService.getImportedSharePointData(),
      ])
        .then(([gaiolasResponse, snapshot]) => {
          const apiItems = gaiolasResponse.items || []
          const fallbackItems = snapshot.gaiolas || []
          setGaiolas(apiItems.length > 0 ? apiItems : fallbackItems)
          setPlantel((snapshot.plantel || []).map(mapPlantelRecord))
        })
        .catch(() => {
          setError('Não foi possível carregar as gaiolas.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  // ─── Quando seleciona uma gaiola, carrega o form de edição ────────────────
  useEffect(() => {
    if (selected) {
      setEditForm({ NumeroGaiola: selected.NumeroGaiola, Status: selected.Status })
      setIsAdding(false)
    }
  }, [selected])

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editForm.NumeroGaiola.trim()) { setError('Número da gaiola é obrigatório.'); return }
    if (USE_MOCK) {
      setGaiolas(prev => prev.map(g => g.ID === selected.ID ? { ...g, ...editForm } : g))
      setSelected({ ...selected, ...editForm })
      setError('')
      return
    }

    gaiolasService.atualizar(selected.ID, editForm)
      .then((response) => {
        setGaiolas(response.items || [])
        setSelected(response.item || null)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Não foi possível salvar a gaiola.')
      })
  }

  const handleAddNew = () => {
    if (!newForm.NumeroGaiola.trim()) { setError('Número da gaiola é obrigatório.'); return }
    if (USE_MOCK) {
      const novo = { ID: Date.now(), ...newForm }
      setGaiolas(prev => [...prev, novo])
      setNewForm({ NumeroGaiola: '', Status: 'Vazia' })
      setIsAdding(false)
      setError('')
      return
    }

    gaiolasService.criar(newForm)
      .then((response) => {
        setGaiolas(response.items || [])
        setNewForm({ NumeroGaiola: '', Status: 'Vazia' })
        setIsAdding(false)
        setSelected(response.item || null)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Não foi possível cadastrar a gaiola.')
      })
  }

  const handleDelete = () => {
    if (USE_MOCK) {
      setGaiolas(prev => prev.filter(g => g.ID !== delTarget.ID))
      if (selected?.ID === delTarget.ID) { setSelected(null); setEditForm(null) }
      setDelTarget(null)
      return
    }

    gaiolasService.remover(delTarget.ID)
      .then((response) => {
        setGaiolas(response.items || [])
        if (selected?.ID === delTarget.ID) { setSelected(null); setEditForm(null) }
        setDelTarget(null)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Não foi possível remover a gaiola.')
        setDelTarget(null)
      })
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = gaiolas.filter(g =>
    [g.NumeroGaiola, g.Status].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const birdsInCage = selected ? plantel.filter(p => p.Gaiola === selected.NumeroGaiola && isAliveBird(p)) : []

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: gaiolas.length,
    chocando: gaiolas.filter(g => g.Status === 'Chocando').length,
    vazias: gaiolas.filter(g => g.Status === 'Vazia').length,
    acasalando: gaiolas.filter(g => g.Status === 'Acasalando').length,
  }

  if (loading) return (
    <div className="flex items-center justify-center text-muted" style={{ height: '50vh', fontSize: 13 }}>
      Carregando gaiolas...
    </div>
  )

  return (
    <div>
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Ambientes</div>
          <h2 className="module-hero__title">Gestão de gaiolas</h2>
          <div className="module-hero__text">
            Organize ocupação, status de cada gaiola e a relação das aves por espaço com uma leitura mais direta para o manejo diário.
          </div>
        </div>
        <div className="pill">Mapa operacional</div>
      </div>

      {error && (
        <div className="p-alert--error">
          {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}>x</span>
        </div>
      )}

      {/* Stats */}
      <div className="p-stats mb-3">
        <StatCard label="Total Gaiolas" value={stats.total} desc="gaiolas cadastradas" color="#C95025" />
        <StatCard label="Chocando" value={stats.chocando} desc="em período de choco" color="#F5A623" />
        <StatCard label="Vazias" value={stats.vazias} desc="sem aves" color="#8A9E8C" />
        <StatCard label="Acasalando" value={stats.acasalando} desc="em acasalamento" color="#E88DB4" />
      </div>

      {/* Master-Detail Layout */}
      <div className="p-split">

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div className="module-panel">
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Controle de Gaiolas</div>
              <div className="p-panel-header__subtitle">
                {filtered.length} de {gaiolas.length} registros
              </div>
            </div>
            <button className="p-btn p-btn--primary" onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }}>
              + Nova Gaiola
            </button>
          </div>

          {/* Search */}
          <div className="p-panel-search">
            <input
              className="p-search"
              placeholder="Buscar por número ou status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div className="p-panel-list">
            {filtered.length === 0 ? (
              <div className="module-empty">
                <div className="text-muted" style={{ fontSize: 14 }}>Nenhuma gaiola encontrada</div>
              </div>
            ) : filtered.map(g => (
              <div
                key={g.ID}
                className={`p-list-item ${selected?.ID === g.ID ? 'is-active' : ''}`}
                onClick={() => { setSelected(g); setIsAdding(false) }}
              >
                <div>
                  <div className="font-serif" style={{ fontSize: 16, fontWeight: 700 }}>
                    {g.NumeroGaiola}
                  </div>
                  <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                    {plantel.filter(p => p.Gaiola === g.NumeroGaiola && isAliveBird(p)).length} ave(s)
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={g.Status} />
                  <button
                    onClick={e => { e.stopPropagation(); setDelTarget(g) }}
                    className="p-btn p-btn--ghost p-btn--sm"
                    style={{ color: '#E05C4B', opacity: 0.5 }}
                    title="Remover"
                  >x</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT PANEL: Detail / Form ═══ */}
        <div className="module-panel">
          {isAdding ? (
            /* ── New Cage Form ── */
            <div className="p-panel-body">
              <div className="p-panel-header__title mb-2" style={{ fontSize: 22 }}>
                Nova Gaiola
              </div>
              <div className="flex-col gap-2">
                <div className="p-field">
                  <label className="p-label">Número da Gaiola</label>
                  <input className="p-input" value={newForm.NumeroGaiola} onChange={e => setNewForm(f => ({ ...f, NumeroGaiola: e.target.value }))} placeholder="Ex: G-07" />
                </div>
                <div className="p-field">
                  <label className="p-label">Status</label>
                  <select className="p-select" value={newForm.Status} onChange={e => setNewForm(f => ({ ...f, Status: e.target.value }))}>
                    {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                  <button className="p-btn p-btn--primary" onClick={handleAddNew}>Salvar</button>
                  <button className="p-btn p-btn--secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : selected && editForm ? (
            /* ── Selected Cage Detail + Edit ── */
            <div>
              <div className="p-panel-header">
                <div>
                  <div className="p-panel-header__title" style={{ fontSize: 24 }}>
                    {selected.NumeroGaiola}
                  </div>
                  <div className="text-muted mt-1">
                    <StatusBadge status={selected.Status} />
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="p-panel-body" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="pill pill--accent mb-2" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Editar Gaiola
                </div>
                <div className="flex-col gap-2">
                  <div className="p-field">
                    <label className="p-label">Número da Gaiola</label>
                    <input className="p-input" value={editForm.NumeroGaiola} onChange={e => setEditForm(f => ({ ...f, NumeroGaiola: e.target.value }))} />
                  </div>
                  <div className="p-field">
                    <label className="p-label">Status</label>
                    <select className="p-select" value={editForm.Status} onChange={e => setEditForm(f => ({ ...f, Status: e.target.value }))}>
                      {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-1 mt-3" style={{ flexWrap: 'wrap' }}>
                    <button className="p-btn p-btn--primary" onClick={handleSaveEdit}>Salvar Alterações</button>
                  </div>
                </div>
              </div>

              {/* Birds in Cage */}
              <div className="p-panel-body">
                <div className="pill pill--accent mb-2" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Aves na Gaiola ({birdsInCage.length})
                </div>

                {selected.Status !== 'Chocando' && (
                  <div className="p-alert--error mb-2" style={{ background: 'rgba(201,80,37,0.08)', borderColor: 'rgba(201,80,37,0.2)', color: '#C95025', fontSize: 12, lineHeight: 1.5 }}>
                    Selecione a Gaiola ao lado para realizar a gestão ou para movimentar as aves de gaiola, faça a movimentação pela gestão do plantel.
                  </div>
                )}

                {birdsInCage.length === 0 ? (
                  <div className="module-empty text-muted" style={{ padding: '24px 0', fontSize: 13 }}>
                    Nenhuma ave nesta gaiola
                  </div>
                ) : (
                  <div className="flex-col gap-1">
                    {birdsInCage.map(bird => (
                      <div key={bird.ID} className="module-panel" style={{ padding: '14px 16px' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif" style={{ fontSize: 14, fontWeight: 700 }}>
                            {bird.Nome}
                          </span>
                          <StatusBadge status={bird.Status} />
                        </div>
                        <div className="p-form-grid">
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            Nascimento: <span className="text-faint">{bird.DataNascimento}</span>
                          </div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            Mutação: <span className="text-faint">{bird.Mutacao}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── No Selection ── */
            <div className="module-empty">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  Selecione uma gaiola ao lado para<br />visualizar detalhes e aves
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação */}
      {delTarget && (
        <ConfirmModal
          title="Remover gaiola?"
          message={`A gaiola "${delTarget.NumeroGaiola}" será removida. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
