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
  { ID: 4, Nome: 'Manchinha', Status: 'Vivo', DataNascimento: '10/08/2023', Mutacao: 'Canela Pastel', Gaiola: '001', Genero: 'Fêmea', CategoriaAve: 'Tarim' },
  { ID: 9, Nome: 'Pardinho', Status: 'Vivo', DataNascimento: '10/08/2023', Mutacao: 'Duplo Diluído', Gaiola: '001', Genero: 'Macho', CategoriaAve: 'Tarim' },
  { ID: 8, Nome: 'Hulk', Status: 'Vivo', DataNascimento: '', Mutacao: 'Canela', Gaiola: '002', Genero: 'Macho', CategoriaAve: 'Tarim' },
  { ID: 10, Nome: 'Bandite', Status: 'Vivo', DataNascimento: '', Mutacao: '', Gaiola: '003', Genero: 'Macho', CategoriaAve: 'canário belga' },
  { ID: 11, Nome: 'Pardinha', Status: 'Vivo', DataNascimento: '2025-11-18', Mutacao: 'Canela Pastel', Gaiola: '003', Genero: 'Femea', CategoriaAve: 'Tarim' },
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

// ─── Estilos reutilizáveis ──────────────────────────────────────────────────
const s = {
  input: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  select: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
    appearance: 'none', cursor: 'pointer',
  },
  label: {
    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, display: 'block',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none',
    borderRadius: 14, padding: '12px 20px', color: 'var(--text-main)', fontSize: 12,
    fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '12px 20px', color: 'var(--text-soft)', fontSize: 12,
    fontFamily: 'inherit', cursor: 'pointer',
  },
  card: {
    overflow: 'hidden',
  },
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
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
        <div style={{ background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#E05C4B', fontSize: 13, fontFamily: 'inherit' }}>
          {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}>x</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Gaiolas" value={stats.total} desc="gaiolas cadastradas" color="#C95025" />
        <StatCard label="Chocando" value={stats.chocando} desc="em período de choco" color="#F5A623" />
        <StatCard label="Vazias" value={stats.vazias} desc="sem aves" color="#8A9E8C" />
        <StatCard label="Acasalando" value={stats.acasalando} desc="em acasalamento" color="#E88DB4" />
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div className="module-panel" style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>Controle de Gaiolas</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2 }}>
                {filtered.length} de {gaiolas.length} registros
              </div>
            </div>
            <button onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }} style={s.btnPrimary}>
              + Nova Gaiola
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              style={s.input}
              placeholder="Buscar por número ou status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: 14, fontFamily: 'inherit', color: 'var(--text-muted)' }}>Nenhuma gaiola encontrada</div>
              </div>
            ) : filtered.map(g => (
              <div
                key={g.ID}
                onClick={() => { setSelected(g); setIsAdding(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 22px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: selected?.ID === g.ID ? 'rgba(201,80,37,0.08)' : 'transparent',
                  borderLeft: selected?.ID === g.ID ? '3px solid #C95025' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (selected?.ID !== g.ID) e.currentTarget.style.background = 'rgba(201,80,37,0.04)' }}
                onMouseLeave={e => { if (selected?.ID !== g.ID) e.currentTarget.style.background = 'transparent' }}
              >
                <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                      {g.NumeroGaiola}
                    </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2 }}>
                    {plantel.filter(p => p.Gaiola === g.NumeroGaiola && isAliveBird(p)).length} ave(s)
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={g.Status} />
                  <button
                    onClick={e => { e.stopPropagation(); setDelTarget(g) }}
                    style={{ background: 'none', border: 'none', color: '#E05C4B', cursor: 'pointer', fontSize: 14, opacity: 0.5, padding: 4 }}
                    title="Remover"
                  >x</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT PANEL: Detail / Form ═══ */}
        <div className="module-panel" style={s.card}>
          {isAdding ? (
            /* ── New Cage Form ── */
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>
                Nova Gaiola
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={s.label}>Número da Gaiola</label>
                  <input style={s.input} value={newForm.NumeroGaiola} onChange={e => setNewForm(f => ({ ...f, NumeroGaiola: e.target.value }))} placeholder="Ex: G-07" />
                </div>
                <div>
                  <label style={s.label}>Status</label>
                  <select style={s.select} value={newForm.Status} onChange={e => setNewForm(f => ({ ...f, Status: e.target.value }))}>
                    {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleAddNew} style={s.btnPrimary}>Salvar</button>
                  <button onClick={() => setIsAdding(false)} style={s.btnSecondary}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : selected && editForm ? (
            /* ── Selected Cage Detail + Edit ── */
            <div>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                  {selected.NumeroGaiola}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 4 }}>
                  <StatusBadge status={selected.Status} />
                </div>
              </div>

              {/* Edit Form */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: 'inherit', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Editar Gaiola
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={s.label}>Número da Gaiola</label>
                    <input style={s.input} value={editForm.NumeroGaiola} onChange={e => setEditForm(f => ({ ...f, NumeroGaiola: e.target.value }))} />
                  </div>
                  <div>
                    <label style={s.label}>Status</label>
                    <select style={s.select} value={editForm.Status} onChange={e => setEditForm(f => ({ ...f, Status: e.target.value }))}>
                      {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={handleSaveEdit} style={s.btnPrimary}>Salvar Alterações</button>
                  </div>
                </div>
              </div>

              {/* Birds in Cage */}
              <div style={{ padding: '16px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: 'inherit', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Aves na Gaiola ({birdsInCage.length})
                </div>

                {selected.Status !== 'Chocando' && (
                  <div style={{ background: 'rgba(201,80,37,0.08)', border: '1px solid rgba(201,80,37,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#C95025', fontSize: 12, fontFamily: 'inherit', lineHeight: 1.5 }}>
                    Selecione a Gaiola ao lado para realizar a gestão ou para movimentar as aves de gaiola, faça a movimentação pela gestão do plantel.
                  </div>
                )}

                {birdsInCage.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit' }}>
                    Nenhuma ave nesta gaiola
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {birdsInCage.map(bird => (
                      <div key={bird.ID} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16, padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                            {bird.Nome}
                          </span>
                          <StatusBadge status={bird.Status} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 4 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                            Nascimento: <span style={{ color: 'var(--text-soft)' }}>{bird.DataNascimento}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                            Mutação: <span style={{ color: 'var(--text-soft)' }}>{bird.Mutacao}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, padding: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'inherit', lineHeight: 1.6 }}>
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
