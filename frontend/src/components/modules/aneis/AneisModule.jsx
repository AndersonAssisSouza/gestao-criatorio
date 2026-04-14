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
    <div className="module-empty">
      Carregando anéis...
    </div>
  )

  // ─── Formulário reutilizável ──────────────────────────────────────────────
  const renderForm = (form, setForm) => (
    <div className="p-form-grid--full">
      <div className="p-field">
        <label className="p-label">Número do Anel</label>
        <input className="p-input" value={form.NumeroAnel} onChange={e => setForm(f => ({ ...f, NumeroAnel: e.target.value }))} placeholder="Ex: AZ-2025-004" />
      </div>
      <div className="p-field">
        <label className="p-label">Status</label>
        <input className="p-input" value={form.Status} onChange={e => setForm(f => ({ ...f, Status: e.target.value }))} placeholder="Ex: Disponível, Utilizado" />
      </div>
      <div className="p-field">
        <label className="p-label">Cor</label>
        <input className="p-input" value={form.Cor} onChange={e => setForm(f => ({ ...f, Cor: e.target.value }))} placeholder="Ex: Azul, Verde" />
      </div>
      <div className="p-form-grid">
        <div className="p-field">
          <label className="p-label">Ano</label>
          <input className="p-input" value={form.Ano} onChange={e => setForm(f => ({ ...f, Ano: e.target.value }))} placeholder="2025" />
        </div>
        <div className="p-field">
          <label className="p-label">Órgão Regulador</label>
          <input className="p-input" value={form.OrgaoRegulador} onChange={e => setForm(f => ({ ...f, OrgaoRegulador: e.target.value }))} placeholder="Ex: FOB, IBAMA" />
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
        <div className="p-alert p-alert--error">
          {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}>x</span>
        </div>
      )}

      {/* Stats */}
      <div className="p-stats" style={{ marginBottom: 28 }}>
        <StatCard label="Total Anéis" value={stats.total} desc="anéis cadastrados" color="#C95025" />
        <StatCard label="Utilizados" value={stats.utilizados} desc="colocados em aves" color="#F5A623" />
        <StatCard label="Disponíveis" value={stats.disponiveis} desc="prontos para uso" color="#4CAF7D" />
      </div>

      {/* Master-Detail Layout */}
      <div className="p-split">

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div className="module-panel">
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Gestão de Anéis</div>
              <div className="p-panel-header__subtitle">
                {filtered.length} de {data.length} registros
              </div>
            </div>
            <button onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }} className="p-btn p-btn--primary">
              + Novo Anel
            </button>
          </div>

          {/* Search */}
          <div className="p-panel-search">
            <input
              className="p-input"
              placeholder="Buscar por cor, status, ano, número..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div className="p-panel-list">
            {filtered.length === 0 ? (
              <div className="module-empty">
                <div className="text-muted" style={{ fontSize: 14 }}>Nenhum anel encontrado</div>
              </div>
            ) : filtered.map(r => (
              <div
                key={r.ID}
                onClick={() => setSelected(r)}
                className={`p-list-item${selected?.ID === r.ID ? ' is-active' : ''}`}
              >
                <div>
                <div className="font-serif" style={{ fontSize: 16, fontWeight: 700 }}>
                  {r.NumeroAnel}
                </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      Cor: <span className="text-faint">{r.Cor}</span>
                    </span>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      Ano: <span className="text-faint">{r.Ano}</span>
                    </span>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      {r.OrgaoRegulador}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={r.Status} />
                  <button
                    onClick={e => { e.stopPropagation(); setDelTarget(r) }}
                    className="p-btn p-btn--ghost"
                    style={{ color: '#E05C4B', fontSize: 14, opacity: 0.5, padding: 4 }}
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
              <div className="font-serif" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                Novo Anel
              </div>
              {renderForm(newForm, setNewForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleAddNew} className="p-btn p-btn--primary">Salvar</button>
                <button onClick={() => setIsAdding(false)} className="p-btn p-btn--secondary">Cancelar</button>
              </div>
            </div>
          ) : selected && editForm ? (
            <div className="p-panel-body">
              <div className="font-serif" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {selected.NumeroAnel}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                <StatusBadge status={selected.Status} />
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {selected.Cor} | {selected.Ano} | {selected.OrgaoRegulador}
                </span>
              </div>
              <div className="p-label" style={{ color: '#C95025', fontWeight: 700, marginBottom: 14 }}>
                Editar Anel
              </div>
              {renderForm(editForm, setEditForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleSaveEdit} className="p-btn p-btn--primary">Salvar Alterações</button>
              </div>
            </div>
          ) : (
            <div className="module-empty">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
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
