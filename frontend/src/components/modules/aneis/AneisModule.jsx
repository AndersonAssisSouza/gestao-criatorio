import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { accessService } from '../../../services/access.service'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_ANEIS = [
  { ID: 1, NumeroAnel: '033', Status: 'Ativo', Cor: 'Rosa', Ano: '2021', OrgaoRegulador: 'FOB' },
  { ID: 2, NumeroAnel: '002', Status: 'Ativo', Cor: 'Rosa', Ano: '2021', OrgaoRegulador: 'FOB' },
  { ID: 3, NumeroAnel: 'JI783', Status: 'Ativo', Cor: 'Preto', Ano: '2023', OrgaoRegulador: '' },
]

// ─── Estilos reutilizáveis ──────────────────────────────────────────────────
const s = {
  input: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
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

const EMPTY_FORM = { NumeroAnel: '', Status: '', Cor: '', Ano: '', OrgaoRegulador: '' }

export function AneisModule() {
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
      setTimeout(() => { setData(MOCK_ANEIS); setLoading(false) }, 400)
    } else {
      accessService.getImportedSharePointData()
        .then((snapshot) => {
          setData(snapshot.aneis || [])
        })
        .catch(() => {
          setError('Não foi possível carregar os anéis importados.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  useEffect(() => {
    if (selected) {
      setEditForm({
        NumeroAnel: selected.NumeroAnel,
        Status: selected.Status,
        Cor: selected.Cor,
        Ano: selected.Ano,
        OrgaoRegulador: selected.OrgaoRegulador,
      })
      setIsAdding(false)
    }
  }, [selected])

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editForm.NumeroAnel.trim()) { setError('Número do anel é obrigatório.'); return }
    setData(prev => prev.map(r => r.ID === selected.ID ? { ...r, ...editForm } : r))
    setSelected({ ...selected, ...editForm })
    setError('')
  }

  const handleAddNew = () => {
    if (!newForm.NumeroAnel.trim()) { setError('Número do anel é obrigatório.'); return }
    const novo = { ID: Date.now(), ...newForm }
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

  // ─── Filtro: Cor, Status, Ano, NumeroAnel ─────────────────────────────────
  const filtered = data.filter(r =>
    [r.Cor, r.Status, r.Ano, r.NumeroAnel, r.OrgaoRegulador]
      .join(' ').toLowerCase().includes(search.toLowerCase())
  )

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: data.length,
    utilizados: data.filter(r => r.Status === 'Utilizado').length,
    disponiveis: data.filter(r => r.Status === 'Disponível').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
      Carregando anéis...
    </div>
  )

  // ─── Formulário reutilizável ──────────────────────────────────────────────
  const renderForm = (form, setForm) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={s.label}>Número do Anel</label>
        <input style={s.input} value={form.NumeroAnel} onChange={e => setForm(f => ({ ...f, NumeroAnel: e.target.value }))} placeholder="Ex: AZ-2025-004" />
      </div>
      <div>
        <label style={s.label}>Status</label>
        <input style={s.input} value={form.Status} onChange={e => setForm(f => ({ ...f, Status: e.target.value }))} placeholder="Ex: Disponível, Utilizado" />
      </div>
      <div>
        <label style={s.label}>Cor</label>
        <input style={s.input} value={form.Cor} onChange={e => setForm(f => ({ ...f, Cor: e.target.value }))} placeholder="Ex: Azul, Verde" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={s.label}>Ano</label>
          <input style={s.input} value={form.Ano} onChange={e => setForm(f => ({ ...f, Ano: e.target.value }))} placeholder="2025" />
        </div>
        <div>
          <label style={s.label}>Órgão Regulador</label>
          <input style={s.input} value={form.OrgaoRegulador} onChange={e => setForm(f => ({ ...f, OrgaoRegulador: e.target.value }))} placeholder="Ex: FOB, IBAMA" />
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Identificação</div>
          <h2 className="module-hero__title">Controle de anéis</h2>
          <div className="module-hero__text">
            Monitore estoque, uso e rastreabilidade dos anéis com uma leitura mais clara para identificação e conformidade.
          </div>
        </div>
        <div className="pill">Rastreio</div>
      </div>

      {error && (
        <div style={{ background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#E05C4B', fontSize: 13, fontFamily: 'inherit' }}>
          {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}>x</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Anéis" value={stats.total} desc="anéis cadastrados" color="#C95025" />
        <StatCard label="Utilizados" value={stats.utilizados} desc="colocados em aves" color="#F5A623" />
        <StatCard label="Disponíveis" value={stats.disponiveis} desc="prontos para uso" color="#4CAF7D" />
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div className="module-panel" style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>Gestão de Anéis</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2 }}>
                {filtered.length} de {data.length} registros
              </div>
            </div>
            <button onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }} style={s.btnPrimary}>
              + Novo Anel
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              style={s.input}
              placeholder="Buscar por cor, status, ano, número..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: 14, fontFamily: 'inherit', color: 'var(--text-muted)' }}>Nenhum anel encontrado</div>
              </div>
            ) : filtered.map(r => (
              <div
                key={r.ID}
                onClick={() => setSelected(r)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 22px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: selected?.ID === r.ID ? 'rgba(201,80,37,0.08)' : 'transparent',
                  borderLeft: selected?.ID === r.ID ? '3px solid #C95025' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (selected?.ID !== r.ID) e.currentTarget.style.background = 'rgba(201,80,37,0.04)' }}
                onMouseLeave={e => { if (selected?.ID !== r.ID) e.currentTarget.style.background = 'transparent' }}
              >
                <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                  {r.NumeroAnel}
                </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                      Cor: <span style={{ color: 'var(--text-soft)' }}>{r.Cor}</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                      Ano: <span style={{ color: 'var(--text-soft)' }}>{r.Ano}</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                      {r.OrgaoRegulador}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={r.Status} />
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
        <div className="module-panel" style={s.card}>
          {isAdding ? (
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>
                Novo Anel
              </div>
              {renderForm(newForm, setNewForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleAddNew} style={s.btnPrimary}>Salvar</button>
                <button onClick={() => setIsAdding(false)} style={s.btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : selected && editForm ? (
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>
                {selected.NumeroAnel}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                <StatusBadge status={selected.Status} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                  {selected.Cor} | {selected.Ano} | {selected.OrgaoRegulador}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: 'inherit', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Editar Anel
              </div>
              {renderForm(editForm, setEditForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleSaveEdit} style={s.btnPrimary}>Salvar Alterações</button>
              </div>
            </div>
          ) : (
            <div className="module-empty">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'inherit', lineHeight: 1.6 }}>
                  Selecione um anel ao lado para<br />visualizar e editar detalhes
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {delTarget && (
        <ConfirmModal
          title="Remover anel?"
          message={`O anel "${delTarget.NumeroAnel}" será removido. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
