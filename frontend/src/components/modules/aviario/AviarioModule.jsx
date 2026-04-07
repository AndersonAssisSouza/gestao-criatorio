import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
// NOTE: This module maps to the "Criatório" screen in Power Apps (GestaoCriatorio SharePoint list)
const USE_MOCK = true

const MOCK_CRIATORIOS = [
  { ID: 1, NomeCriatorio: 'Criadouro Marbella', Responsavel: 'Toninho', CTFCriador: 'CTF-001234', Endereco: 'São Paulo - SP', Acesso: 'Anderson', Telefone: '(11) 99999-0001' },
  { ID: 2, NomeCriatorio: 'Criadouro Próprio', Responsavel: 'Anderson', CTFCriador: 'CTF-005678', Endereco: 'Rio de Janeiro - RJ', Acesso: 'Anderson', Telefone: '(21) 99999-0002' },
]

const ACESSO_OPTIONS = ['Anderson']
const CURRENT_USER = 'Anderson'

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

const EMPTY_FORM = { NomeCriatorio: '', Responsavel: '', CTFCriador: '', Endereco: '', Acesso: CURRENT_USER, Telefone: '' }

export function AviarioModule() {
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
      setTimeout(() => { setData(MOCK_CRIATORIOS); setLoading(false) }, 400)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selected) {
      setEditForm({
        NomeCriatorio: selected.NomeCriatorio,
        Responsavel: selected.Responsavel,
        CTFCriador: selected.CTFCriador,
        Endereco: selected.Endereco,
        Acesso: selected.Acesso,
        Telefone: selected.Telefone,
      })
      setIsAdding(false)
    }
  }, [selected])

  // ─── Filter by Acesso = current user ──────────────────────────────────────
  const userFiltered = data.filter(r => r.Acesso === CURRENT_USER)

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editForm.NomeCriatorio.trim() || !editForm.Responsavel.trim()) { setError('Nome do Criatório e Responsável são obrigatórios.'); return }
    setData(prev => prev.map(r => r.ID === selected.ID ? { ...r, ...editForm } : r))
    setSelected({ ...selected, ...editForm })
    setError('')
  }

  const handleAddNew = () => {
    if (!newForm.NomeCriatorio.trim() || !newForm.Responsavel.trim()) { setError('Nome do Criatório e Responsável são obrigatórios.'); return }
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

  // ─── Search within user-filtered data ─────────────────────────────────────
  const filtered = userFiltered.filter(r =>
    [r.NomeCriatorio, r.Responsavel, r.CTFCriador, r.Endereco, r.Telefone]
      .join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: userFiltered.length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando criatórios...
    </div>
  )

  // ─── Formulário reutilizável ──────────────────────────────────────────────
  const renderForm = (form, setForm) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={s.label}>Nome do Criatório</label>
        <input style={s.input} value={form.NomeCriatorio} onChange={e => setForm(f => ({ ...f, NomeCriatorio: e.target.value }))} placeholder="Nome do criatório" />
      </div>
      <div>
        <label style={s.label}>Responsável</label>
        <input style={s.input} value={form.Responsavel} onChange={e => setForm(f => ({ ...f, Responsavel: e.target.value }))} placeholder="Nome do responsável" />
      </div>
      <div>
        <label style={s.label}>CTF Criador</label>
        <input style={s.input} value={form.CTFCriador} onChange={e => setForm(f => ({ ...f, CTFCriador: e.target.value }))} placeholder="Ex: CTF-001234" />
      </div>
      <div>
        <label style={s.label}>Endereço</label>
        <input style={s.input} value={form.Endereco} onChange={e => setForm(f => ({ ...f, Endereco: e.target.value }))} placeholder="Cidade - UF" />
      </div>
      <div>
        <label style={s.label}>Acesso</label>
        <select style={s.select} value={form.Acesso} onChange={e => setForm(f => ({ ...f, Acesso: e.target.value }))}>
          {ACESSO_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label style={s.label}>Telefone</label>
        <input style={s.input} value={form.Telefone} onChange={e => setForm(f => ({ ...f, Telefone: e.target.value }))} placeholder="(XX) XXXXX-XXXX" />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Meus Criatórios" value={stats.total} desc="criatórios vinculados" color="#C95025" />
        <StatCard label="Usuário Atual" value={CURRENT_USER} desc="acesso ativo" color="#4CAF7D" />
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Criatório</div>
              <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                {filtered.length} de {userFiltered.length} registros
              </div>
            </div>
            <button onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }} style={s.btnPrimary}>
              + Novo Criatório
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              style={s.input}
              placeholder="Buscar criatório..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#3A5C3C' }}>
                <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhum criatório encontrado</div>
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
                      {r.NomeCriatorio}
                    </div>
                    <div style={{ fontSize: 12, color: '#8A9E8C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                      {r.Responsavel}
                    </div>
                    <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                      {r.Endereco} | CTF: {r.CTFCriador}
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
                Novo Criatório
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
                {selected.NomeCriatorio} - {selected.Responsavel}
              </div>
              <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
                Editar informações do criatório
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
                  Selecione um criatório ao lado para<br />visualizar e editar detalhes
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {delTarget && (
        <ConfirmModal
          title="Remover criatório?"
          message={`O criatório "${delTarget.NomeCriatorio}" será removido. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
