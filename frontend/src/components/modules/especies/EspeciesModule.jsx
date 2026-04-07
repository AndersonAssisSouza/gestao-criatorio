import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const USE_MOCK = true

const MOCK_ESPECIES = [
  { ID: 1, Especie: 'Tarin', NomeCientifico: 'Carduelis cucullata', Origem: 'Venezuela e Colômbia. Ave silvestre ameaçada de extinção.', Comentarios: 'Também conhecido como Cardinalito del Venezuela. Principal contribuição para canaricultura: fator vermelho.', PeriodoReproducao: 'Março a Julho', TempoChoco: 14 },
  { ID: 2, Especie: 'Canário', NomeCientifico: 'Serinus canaria', Origem: 'Ilhas Canárias, Madeira e Açores.', Comentarios: 'Mais de 550 cores catalogadas. Base da canaricultura mundial.', PeriodoReproducao: 'Setembro a Fevereiro', TempoChoco: 13 },
  { ID: 3, Especie: 'Pintassilgo', NomeCientifico: 'Carduelis carduelis', Origem: 'Europa, Norte da África e Ásia Ocidental.', Comentarios: 'Popular pela beleza e canto melodioso.', PeriodoReproducao: 'Abril a Agosto', TempoChoco: 12 },
]

// ─── Estilos reutilizáveis ──────────────────────────────────────────────────
const s = {
  input: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13,
    fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  textarea: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13,
    fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box',
    resize: 'vertical', minHeight: 60,
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

const EMPTY_FORM = { Especie: '', NomeCientifico: '', Origem: '', Comentarios: '', PeriodoReproducao: '', TempoChoco: '' }

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

  useEffect(() => {
    if (USE_MOCK) {
      setTimeout(() => { setData(MOCK_ESPECIES); setLoading(false) }, 400)
    } else {
      setLoading(false)
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

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editForm.Especie.trim() || !editForm.NomeCientifico.trim()) { setError('Espécie e Nome Científico são obrigatórios.'); return }
    setData(prev => prev.map(r => r.ID === selected.ID ? { ...r, ...editForm, TempoChoco: Number(editForm.TempoChoco) || 0 } : r))
    setSelected({ ...selected, ...editForm, TempoChoco: Number(editForm.TempoChoco) || 0 })
    setError('')
  }

  const handleAddNew = () => {
    if (!newForm.Especie.trim() || !newForm.NomeCientifico.trim()) { setError('Espécie e Nome Científico são obrigatórios.'); return }
    const novo = { ID: Date.now(), ...newForm, TempoChoco: Number(newForm.TempoChoco) || 0 }
    setData(prev => [...prev, novo])
    setNewForm({ ...EMPTY_FORM })
    setIsAdding(false)
    setError('')
  }

  const handleDelete = () => {
    setData(prev => prev.filter(r => r.ID !== delTarget.ID))
    if (selected?.ID === delTarget.ID) { setSelected(null); setEditForm(null) }
    setDelTarget(null)
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando espécies...
    </div>
  )

  // ─── Formulário reutilizável ──────────────────────────────────────────────
  const renderForm = (form, setForm) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={s.label}>Espécie</label>
        <input style={s.input} value={form.Especie} onChange={e => setForm(f => ({ ...f, Especie: e.target.value }))} placeholder="Nome da espécie" />
      </div>
      <div>
        <label style={s.label}>Nome Científico</label>
        <input style={s.input} value={form.NomeCientifico} onChange={e => setForm(f => ({ ...f, NomeCientifico: e.target.value }))} placeholder="Nome científico" />
      </div>
      <div>
        <label style={s.label}>Origem</label>
        <textarea style={s.textarea} value={form.Origem} onChange={e => setForm(f => ({ ...f, Origem: e.target.value }))} placeholder="Região de origem" />
      </div>
      <div>
        <label style={s.label}>Comentários</label>
        <textarea style={s.textarea} value={form.Comentarios} onChange={e => setForm(f => ({ ...f, Comentarios: e.target.value }))} placeholder="Observações gerais" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={s.label}>Período de Reprodução</label>
          <input style={s.input} value={form.PeriodoReproducao} onChange={e => setForm(f => ({ ...f, PeriodoReproducao: e.target.value }))} placeholder="Ex: Março a Julho" />
        </div>
        <div>
          <label style={s.label}>Tempo de Choco (dias)</label>
          <input style={s.input} type="number" value={form.TempoChoco} onChange={e => setForm(f => ({ ...f, TempoChoco: e.target.value }))} placeholder="14" />
        </div>
      </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Espécies" value={stats.total} desc="espécies catalogadas" color="#C95025" />
        <StatCard label="Tempo Médio Choco" value={`${stats.tempoMedioChoco}d`} desc="dias em média" color="#F5A623" />
        <StatCard label="Catálogo" value={data.length > 0 ? 'Ativo' : 'Vazio'} desc="status do catálogo" color="#4CAF7D" />
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Detalhe Espécies</div>
              <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                {filtered.length} de {data.length} registros
              </div>
            </div>
            <button onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }} style={s.btnPrimary}>
              + Nova Espécie
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              style={s.input}
              placeholder="Buscar espécie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#3A5C3C' }}>
                <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhuma espécie encontrada</div>
              </div>
            ) : filtered.map(r => (
              <div
                key={r.ID}
                onClick={() => setSelected(r)}
                style={{
                  padding: '14px 22px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: selected?.ID === r.ID ? 'rgba(201,80,37,0.08)' : 'transparent',
                  borderLeft: selected?.ID === r.ID ? '3px solid #C95025' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (selected?.ID !== r.ID) e.currentTarget.style.background = 'rgba(201,80,37,0.04)' }}
                onMouseLeave={e => { if (selected?.ID !== r.ID) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>
                      {r.Especie}
                    </div>
                    <div style={{ fontSize: 12, color: '#8A9E8C', fontFamily: "'DM Mono', monospace", fontStyle: 'italic', marginTop: 2 }}>
                      {r.NomeCientifico}
                    </div>
                    <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                      Choco: {r.TempoChoco} dias | {r.PeriodoReproducao}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDelTarget(r) }}
                    style={{ background: 'none', border: 'none', color: '#E05C4B', cursor: 'pointer', fontSize: 14, opacity: 0.5, padding: 4 }}
                    title="Remover"
                  >x</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT PANEL: Detail Form ═══ */}
        <div style={s.card}>
          {isAdding ? (
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>
                Nova Espécie
              </div>
              {renderForm(newForm, setNewForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleAddNew} style={s.btnPrimary}>Salvar</button>
                <button onClick={() => setIsAdding(false)} style={s.btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : selected && editForm ? (
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>
                {selected.Especie} - {selected.NomeCientifico}
              </div>
              <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
                Editar informações da espécie
              </div>
              {renderForm(editForm, setEditForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleSaveEdit} style={s.btnPrimary}>Salvar Alterações</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, padding: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div style={{ fontSize: 14, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
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
