import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const USE_MOCK = true

const MOCK_GAIOLAS = [
  { ID: 1, NumeroGaiola: 'G-01', Status: 'Chocando' },
  { ID: 2, NumeroGaiola: 'G-02', Status: 'Chocando' },
  { ID: 3, NumeroGaiola: 'G-03', Status: 'Com Ave Avulsa' },
  { ID: 4, NumeroGaiola: 'G-04', Status: 'Vazia' },
  { ID: 5, NumeroGaiola: 'G-05', Status: 'Acasalando' },
  { ID: 6, NumeroGaiola: 'G-06', Status: 'Preparacao' },
]

const MOCK_PLANTEL_IN_CAGE = [
  { ID: 1, Nome: 'Thor', Status: 'Vivo', DataNascimento: '2024-08-15', Mutacao: 'Ancestral', Gaiola: 'G-01' },
  { ID: 2, Nome: 'Athena', Status: 'Vivo', DataNascimento: '2025-01-10', Mutacao: 'Canela', Gaiola: 'G-01' },
  { ID: 3, Nome: 'Apollo', Status: 'Vivo', DataNascimento: '2024-11-20', Mutacao: 'Pastel', Gaiola: 'G-02' },
  { ID: 4, Nome: 'Diana', Status: 'Vivo', DataNascimento: '2025-06-05', Mutacao: 'Canela Pastel', Gaiola: 'G-02' },
  { ID: 5, Nome: 'Hermes', Status: 'Vivo', DataNascimento: '2025-09-12', Mutacao: 'Diluído', Gaiola: 'G-03' },
]

const STATUS_OPTIONS = ['Chocando', 'Vazia', 'Preparacao', 'Dividida', 'Com Ave Avulsa', 'Com Duas Aves Separadas', 'Acasalando']

// ─── Estilos reutilizáveis ──────────────────────────────────────────────────
const s = {
  input: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13,
    fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  select: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13,
    fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box',
    appearance: 'none', cursor: 'pointer',
  },
  label: {
    fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, display: 'block',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none',
    borderRadius: 8, padding: '10px 20px', color: '#F2EDE4', fontSize: 12,
    fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 20px', color: '#8A9E8C', fontSize: 12,
    fontFamily: "'DM Mono', monospace", cursor: 'pointer',
  },
  card: {
    background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, overflow: 'hidden',
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
      setLoading(false)
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
    setGaiolas(prev => prev.map(g => g.ID === selected.ID ? { ...g, ...editForm } : g))
    setSelected({ ...selected, ...editForm })
    setError('')
  }

  const handleAddNew = () => {
    if (!newForm.NumeroGaiola.trim()) { setError('Número da gaiola é obrigatório.'); return }
    const novo = { ID: Date.now(), ...newForm }
    setGaiolas(prev => [...prev, novo])
    setNewForm({ NumeroGaiola: '', Status: 'Vazia' })
    setIsAdding(false)
    setError('')
  }

  const handleDelete = () => {
    setGaiolas(prev => prev.filter(g => g.ID !== delTarget.ID))
    if (selected?.ID === delTarget.ID) { setSelected(null); setEditForm(null) }
    setDelTarget(null)
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = gaiolas.filter(g =>
    [g.NumeroGaiola, g.Status].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const birdsInCage = selected ? plantel.filter(p => p.Gaiola === selected.NumeroGaiola) : []

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: gaiolas.length,
    chocando: gaiolas.filter(g => g.Status === 'Chocando').length,
    vazias: gaiolas.filter(g => g.Status === 'Vazia').length,
    acasalando: gaiolas.filter(g => g.Status === 'Acasalando').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando gaiolas...
    </div>
  )

  return (
    <div>
      {error && (
        <div style={{ background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#E05C4B', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
          {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}>x</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Gaiolas" value={stats.total} desc="gaiolas cadastradas" color="#C95025" />
        <StatCard label="Chocando" value={stats.chocando} desc="em período de choco" color="#F5A623" />
        <StatCard label="Vazias" value={stats.vazias} desc="sem aves" color="#8A9E8C" />
        <StatCard label="Acasalando" value={stats.acasalando} desc="em acasalamento" color="#E88DB4" />
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Controle de Gaiolas</div>
              <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
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
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#3A5C3C' }}>
                <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhuma gaiola encontrada</div>
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
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>
                    {g.NumeroGaiola}
                  </div>
                  <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                    {plantel.filter(p => p.Gaiola === g.NumeroGaiola).length} ave(s)
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
        <div style={s.card}>
          {isAdding ? (
            /* ── New Cage Form ── */
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>
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
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={handleAddNew} style={s.btnPrimary}>Salvar</button>
                  <button onClick={() => setIsAdding(false)} style={s.btnSecondary}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : selected && editForm ? (
            /* ── Selected Cage Detail + Edit ── */
            <div>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>
                  {selected.NumeroGaiola}
                </div>
                <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                  <StatusBadge status={selected.Status} />
                </div>
              </div>

              {/* Edit Form */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: "'DM Mono', monospace", marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleSaveEdit} style={s.btnPrimary}>Salvar Alterações</button>
                  </div>
                </div>
              </div>

              {/* Birds in Cage */}
              <div style={{ padding: '16px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: "'DM Mono', monospace", marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Aves na Gaiola ({birdsInCage.length})
                </div>

                {selected.Status !== 'Chocando' && (
                  <div style={{ background: 'rgba(201,80,37,0.08)', border: '1px solid rgba(201,80,37,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#C95025', fontSize: 12, fontFamily: "'DM Mono', monospace", lineHeight: 1.5 }}>
                    Selecione a Gaiola ao lado para realizar a gestão ou para movimentar as aves de gaiola, faça a movimentação pela gestão do plantel.
                  </div>
                )}

                {birdsInCage.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#4A6A4C', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
                    Nenhuma ave nesta gaiola
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {birdsInCage.map(bird => (
                      <div key={bird.ID} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8, padding: '12px 16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>
                            {bird.Nome}
                          </span>
                          <StatusBadge status={bird.Status} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
                            Nascimento: <span style={{ color: '#8A9E8C' }}>{bird.DataNascimento}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
                            Mutação: <span style={{ color: '#8A9E8C' }}>{bird.Mutacao}</span>
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
                <div style={{ fontSize: 14, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
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
