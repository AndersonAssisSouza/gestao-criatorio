import { useState, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { accessService } from '../../../services/access.service'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_FINANCEIRO = [
  { ID: 9, Item: 'Ave', TipoMovimentacao: 'Compra', Produto: 'Ave', Quantidade: 1, Valor: 800, ValorTotal: 800, Data: '2023-11-29', Acesso: 'Anderson Assis' },
  { ID: 10, Item: 'Ave', TipoMovimentacao: 'Compra', Produto: 'Ave', Quantidade: 1, Valor: 800, ValorTotal: 800, Data: '2023-11-29', Acesso: 'Anderson Assis' },
  { ID: 11, Item: 'Ave', TipoMovimentacao: 'Venda', Produto: 'Ave', Quantidade: 1, Valor: 250, ValorTotal: 250, Data: '2023-11-29', Acesso: 'Anderson Assis' },
  { ID: 12, Item: 'Ave', TipoMovimentacao: 'Venda', Produto: 'Ave', Quantidade: 1, Valor: 300, ValorTotal: 300, Data: '2023-11-29', Acesso: 'Anderson Assis' },
  { ID: 13, Item: 'Ave', TipoMovimentacao: 'Compra', Produto: 'Ave', Quantidade: 2, Valor: 275, ValorTotal: 550, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 14, Item: 'Acessório', TipoMovimentacao: 'Compra', Produto: 'Ninhos', Quantidade: 1, Valor: 90, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 15, Item: 'Ração', TipoMovimentacao: 'Compra', Produto: 'Ração Tarim', Quantidade: 1, Valor: 152.83, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 16, Item: 'Ração', TipoMovimentacao: 'Compra', Produto: 'Ração', Quantidade: 1, Valor: 273.10, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 17, Item: 'Ração', TipoMovimentacao: 'Compra', Produto: 'Ração', Quantidade: 1, Valor: 174.50, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 18, Item: 'Ração', TipoMovimentacao: 'Compra', Produto: 'Ração', Quantidade: 1, Valor: 293.31, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 19, Item: 'Ração', TipoMovimentacao: 'Compra', Produto: 'Ração', Quantidade: 1, Valor: 126, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 20, Item: 'Acessório', TipoMovimentacao: 'Venda', Produto: 'Bebedouros automáticos', Quantidade: 1, Valor: 69.75, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 21, Item: 'Ração', TipoMovimentacao: 'Compra', Produto: 'Ração', Quantidade: 1, Valor: 254.99, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 22, Item: 'Ração', TipoMovimentacao: 'Compra', Produto: 'Ração', Quantidade: 1, Valor: 97.17, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
  { ID: 23, Item: 'Ave', TipoMovimentacao: 'Venda', Produto: 'Macho Tarim Ancestral', Quantidade: 1, Valor: 500, ValorTotal: 0, Data: '2024-03-19', Acesso: 'Anderson Assis' },
]

const MOCK_LISTA_ITENS = [
  { Item: 'Ave' }, { Item: 'Ração' }, { Item: 'Gaiola' }, { Item: 'Acessório' }, { Item: 'Medicação' },
]

const TIPO_OPTIONS = ['Compra', 'Venda']
const CURRENT_USER = 'Anderson Assis'
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

const EMPTY_FORM = { Item: '', TipoMovimentacao: 'Compra', Produto: '', Quantidade: 1, Valor: '', Data: '' }

export function FinanceiroModule() {
  const [data, setData] = useState([])
  const [listaItens, setListaItens] = useState(MOCK_LISTA_ITENS)
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
      setTimeout(() => { setData(MOCK_FINANCEIRO); setLoading(false) }, 400)
    } else {
      accessService.getImportedSharePointData()
        .then((snapshot) => {
          setData(snapshot.financeiro || [])
          setListaItens(snapshot.listaItens || [])
        })
        .catch(() => {
          setError('Não foi possível carregar os lançamentos importados.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  useEffect(() => {
    if (selected) {
      setEditForm({
        Item: selected.Item,
        TipoMovimentacao: selected.TipoMovimentacao,
        Valor: selected.Valor,
        Data: selected.Data,
      })
      setIsAdding(false)
    }
  }, [selected])

  // ─── Filter by Acesso = current user ──────────────────────────────────────
  const userFiltered = data

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editForm.Item.trim()) { setError('Item é obrigatório.'); return }
    if (!editForm.Valor || Number(editForm.Valor) <= 0) { setError('Valor deve ser maior que zero.'); return }
    if (!editForm.Data) { setError('Data é obrigatória.'); return }
    const updated = { ...editForm, Valor: Number(editForm.Valor) }
    setData(prev => prev.map(r => r.ID === selected.ID ? { ...r, ...updated } : r))
    setSelected({ ...selected, ...updated })
    setError('')
  }

  const handleAddNew = () => {
    if (!newForm.Item.trim()) { setError('Item é obrigatório.'); return }
    if (!newForm.Valor || Number(newForm.Valor) <= 0) { setError('Valor deve ser maior que zero.'); return }
    if (!newForm.Data) { setError('Data é obrigatória.'); return }
    const novo = { ID: Date.now(), ...newForm, Valor: Number(newForm.Valor), Acesso: CURRENT_USER }
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
    [r.Item, r.TipoMovimentacao].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  // ─── Stats (summary) ─────────────────────────────────────────────────────
  const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const totalReceitas = userFiltered.filter(r => r.TipoMovimentacao === 'Venda').reduce((sum, r) => sum + r.Valor, 0)
  const totalDespesas = userFiltered.filter(r => r.TipoMovimentacao === 'Compra').reduce((sum, r) => sum + r.Valor, 0)
  const saldo = totalReceitas - totalDespesas

  // ─── Distinct items for dropdown ──────────────────────────────────────────
  const distinctItens = [...new Set(listaItens.map(i => i.Item))]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
      Carregando registros financeiros...
    </div>
  )

  // ─── Formulário reutilizável ──────────────────────────────────────────────
  const renderForm = (form, setForm) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={s.label}>Item</label>
        <select style={s.select} value={form.Item} onChange={e => setForm(f => ({ ...f, Item: e.target.value }))}>
          <option value="">Selecione um item...</option>
          {distinctItens.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div>
        <label style={s.label}>Tipo de Movimentação</label>
        <select style={s.select} value={form.TipoMovimentacao} onChange={e => setForm(f => ({ ...f, TipoMovimentacao: e.target.value }))}>
          {TIPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label style={s.label}>Valor (R$)</label>
        <input style={s.input} type="number" step="0.01" min="0" value={form.Valor} onChange={e => setForm(f => ({ ...f, Valor: e.target.value }))} placeholder="0.00" />
      </div>
      <div>
        <label style={s.label}>Data</label>
        <input style={s.input} type="date" value={form.Data} onChange={e => setForm(f => ({ ...f, Data: e.target.value }))} />
      </div>
    </div>
  )

  return (
    <div>
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Fluxo financeiro</div>
          <h2 className="module-hero__title">Gestão financeira do criatório</h2>
          <div className="module-hero__text">
            Registre receitas e despesas, acompanhe saldo e mantenha uma leitura rápida da saúde financeira da operação.
          </div>
        </div>
        <div className="pill">Resumo mensal</div>
      </div>

      {error && (
        <div style={{ background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#E05C4B', fontSize: 13, fontFamily: 'inherit' }}>
          {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}>x</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Vendas" value={`R$ ${fmt(totalReceitas)}`} desc="vendas acumuladas" color="#4CAF7D" />
        <StatCard label="Total Compras" value={`R$ ${fmt(totalDespesas)}`} desc="compras acumuladas" color="#E05C4B" />
        <StatCard label="Saldo" value={`R$ ${fmt(saldo)}`} desc="receitas - despesas" color={saldo >= 0 ? '#C95025' : '#E05C4B'} />
      </div>

      {/* Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* ═══ LEFT PANEL: Gallery ═══ */}
        <div className="module-panel" style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>Movimentações</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2 }}>
                {filtered.length} de {userFiltered.length} registros
              </div>
            </div>
            <button onClick={() => { setIsAdding(true); setSelected(null); setEditForm(null) }} style={s.btnPrimary}>
              + Nova Movimentação
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              style={s.input}
              placeholder="Buscar por item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gallery Items */}
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: 14, fontFamily: 'inherit', color: 'var(--text-muted)' }}>Nenhum registro encontrado</div>
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
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                  {r.Item}
                </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                      color: r.TipoMovimentacao === 'Receita' ? '#4CAF7D' : '#E05C4B',
                    }}>
                      {r.TipoMovimentacao}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                      {r.Data}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                    color: r.TipoMovimentacao === 'Receita' ? '#4CAF7D' : '#E05C4B',
                  }}>
                    R$ {fmt(r.Valor)}
                  </span>
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
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>
                Nova Movimentação
              </div>
              {renderForm(newForm, setNewForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={handleAddNew} style={s.btnPrimary}>Salvar</button>
                <button onClick={() => setIsAdding(false)} style={s.btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : selected && editForm ? (
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>
                {selected.Item}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  color: selected.TipoMovimentacao === 'Receita' ? '#4CAF7D' : '#E05C4B',
                }}>
                  {selected.TipoMovimentacao}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                  R$ {fmt(selected.Valor)} | {selected.Data}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: 'inherit', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Editar Movimentação
              </div>
              {renderForm(editForm, setEditForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={handleSaveEdit} style={s.btnPrimary}>Salvar Alterações</button>
              </div>
            </div>
          ) : (
            <div className="module-empty">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'inherit', lineHeight: 1.6 }}>
                  Selecione uma movimentação ao lado<br />para visualizar e editar detalhes
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {delTarget && (
        <ConfirmModal
          title="Remover movimentação?"
          message={`O registro "${delTarget.Item}" será removido. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
