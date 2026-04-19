import { useEffect, useMemo, useState } from 'react'
import { cuponsService } from '../../../services/cupons.service'
import { StatCard } from '../../shared/StatCard'

function brl(value) {
  const n = Number(value || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('pt-BR') } catch { return '—' }
}

function formatDateTime(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString('pt-BR') } catch { return '—' }
}

const EMPTY_FORM = {
  codigo: '', captadorNome: '', captadorEmail: '', pixChave: '',
  tier: 'bronze', descontoPercentual: 15, comissaoPercentual: 20,
  comissaoDuracaoMeses: 12, status: 'ativo', observacao: '',
}

export function CuponsPanel() {
  const [loading, setLoading] = useState(true)
  const [cupons, setCupons] = useState([])
  const [tiers, setTiers] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pedidosPendentes, setPedidosPendentes] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [detalhes, setDetalhes] = useState(null)
  const [payoutValor, setPayoutValor] = useState('')
  const [registrandoPayout, setRegistrandoPayout] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [response, pedidos] = await Promise.all([
        cuponsService.listAdmin(),
        cuponsService.payoutRequests().catch(() => ({ pendentes: [] })),
      ])
      setCupons(response.items || [])
      setTiers(response.tiers || {})
      setPedidosPendentes(pedidos.pendentes || [])
      setError('')
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao carregar cupons.')
    } finally {
      setLoading(false)
    }
  }

  const resolverPedido = async (pedido) => {
    if (!confirm(`Confirmar pagamento de ${brl(pedido.valor)} para ${pedido.captadorNome} via PIX ${pedido.pixChave}?`)) return
    try {
      await cuponsService.payout(pedido.cupomId, {
        valor: pedido.valor,
        descricao: `Pagamento PIX — pedido ${pedido.id.slice(0, 8)}`,
      })
      setSuccess(`Pagamento de ${brl(pedido.valor)} registrado.`)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao registrar pagamento.')
    }
  }

  useEffect(() => { loadData() }, [])

  const stats = useMemo(() => {
    const totalCupons = cupons.length
    const ativos = cupons.filter((c) => c.status === 'ativo').length
    const totalIndicacoes = cupons.reduce((s, c) => s + (c.totalIndicacoes || 0), 0)
    const saldoAcumulado = cupons.reduce((s, c) => s + (c.saldo?.saldoTotal || 0), 0)
    return { totalCupons, ativos, totalIndicacoes, saldoAcumulado }
  }, [cupons])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (cupom) => {
    setEditingId(cupom.id)
    setForm({
      codigo: cupom.codigo,
      captadorNome: cupom.captadorNome || '',
      captadorEmail: cupom.captadorEmail || '',
      pixChave: cupom.pixChave || '',
      tier: cupom.tier || 'bronze',
      descontoPercentual: cupom.descontoPercentual ?? 15,
      comissaoPercentual: cupom.comissaoPercentual ?? 20,
      comissaoDuracaoMeses: cupom.comissaoDuracaoMeses ?? 12,
      status: cupom.status || 'ativo',
      observacao: cupom.observacao || '',
    })
    setShowForm(true)
  }

  const applyTierDefaults = (tier) => {
    const defaults = tiers[tier]
    if (!defaults) return
    setForm((f) => ({
      ...f,
      tier,
      descontoPercentual: defaults.descontoPercentual,
      comissaoPercentual: defaults.comissaoPercentual,
      comissaoDuracaoMeses: defaults.comissaoDuracaoMeses,
    }))
  }

  const saveForm = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (editingId) {
        await cuponsService.update(editingId, form)
        setSuccess('Cupom atualizado.')
      } else {
        await cuponsService.create(form)
        setSuccess('Cupom criado com sucesso.')
      }
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao salvar cupom.')
    } finally {
      setSaving(false)
    }
  }

  const removeCupom = async (id) => {
    if (!confirm('Remover este cupom? Histórico de indicações e créditos será mantido.')) return
    try {
      await cuponsService.remove(id)
      setSuccess('Cupom removido.')
      await loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao remover.')
    }
  }

  const openDetalhes = async (cupom) => {
    try {
      const data = await cuponsService.detalhes(cupom.id)
      setDetalhes(data)
      setPayoutValor('')
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao carregar detalhes.')
    }
  }

  const registrarPayout = async () => {
    if (!detalhes?.cupom?.id) return
    const valor = Number(payoutValor)
    if (!valor || valor <= 0) { setError('Valor inválido.'); return }
    setRegistrandoPayout(true)
    setError('')
    try {
      await cuponsService.payout(detalhes.cupom.id, { valor, descricao: `Payout PIX para ${detalhes.cupom.captadorNome}` })
      setSuccess('Pagamento registrado.')
      const data = await cuponsService.detalhes(detalhes.cupom.id)
      setDetalhes(data)
      setPayoutValor('')
      await loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao registrar pagamento.')
    } finally {
      setRegistrandoPayout(false)
    }
  }

  const CARD = { background: 'var(--bg-panel-solid, var(--panel, #fff))', border: '1px solid var(--line-soft)', borderRadius: 12, padding: 18 }
  const MODAL_CARD = {
    background: 'var(--bg-panel-solid, var(--panel, #fff))',
    border: '1px solid var(--line-soft)',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
    color: 'var(--text)',
  }
  const INPUT = { width: '100%', padding: '8px 12px', border: '1px solid var(--line-soft)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }
  const LABEL = { fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'block' }
  const BTN_PRIMARY = { background: 'var(--accent)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }
  const BTN_GHOST = { background: 'transparent', color: 'var(--text)', border: '1px solid var(--line-soft)', padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando cupons…</div>

  return (
    <div style={{ padding: '0 4px' }}>
      {error && <div style={{ ...CARD, background: '#FDECEA', color: '#B71C1C', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ ...CARD, background: '#E8F5E9', color: '#1B5E20', marginBottom: 12 }}>{success}</div>}

      {pedidosPendentes.length > 0 && (
        <div style={{
          ...CARD,
          background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
          borderColor: '#FB8C00',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E65100' }}>
                💸 {pedidosPendentes.length} pedido{pedidosPendentes.length > 1 ? 's' : ''} de saque pendente{pedidosPendentes.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 12, color: '#6D4C41', marginTop: 2 }}>
                Faça o PIX manualmente e clique em "Marcar como pago" abaixo.
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#E65100' }}>
              {brl(pedidosPendentes.reduce((s, p) => s + p.valor, 0))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {pedidosPendentes.map((p) => (
              <div key={p.id} style={{
                padding: 10, background: 'rgba(255,255,255,0.7)',
                borderRadius: 6, display: 'grid',
                gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                fontSize: 13,
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#333' }}>
                    {p.captadorNome} <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6D4C41' }}>· {p.cupomCodigo}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    <strong>PIX:</strong> <code style={{ background: 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: 3 }}>{p.pixChave || 'Não informada'}</code>
                    {' · '}
                    <strong>Valor:</strong> {brl(p.valor)}
                    {' · '}
                    <span style={{ color: '#999' }}>{formatDateTime(p.createdAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => resolverPedido(p)}
                  style={{
                    background: '#2E7D32', color: '#fff', border: 'none',
                    padding: '8px 14px', borderRadius: 6, fontSize: 12,
                    fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  ✓ Marcar como pago
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-stats">
        <StatCard label="Cupons" value={stats.totalCupons} desc="cadastrados" color="#C95025" />
        <StatCard label="Ativos" value={stats.ativos} desc="em uso" color="#4CAF7D" />
        <StatCard label="Indicações" value={stats.totalIndicacoes} desc="convertidas" color="#5BC0EB" />
        <StatCard label="Creditado" value={brl(stats.saldoAcumulado)} desc="total gerado" color="#F5A623" />
      </div>

      <div style={{ ...CARD, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontFamily: "'DM Serif Display', serif" }}>Cupons de captadores</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Desconto para cliente + comissão para quem indica</div>
          </div>
          <button type="button" style={BTN_PRIMARY} onClick={openCreate}>+ Novo cupom</button>
        </div>

        {cupons.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhum cupom cadastrado. Crie seu primeiro para começar o programa de indicações.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line-soft)' }}>
                  <th style={{ padding: 8 }}>Código</th>
                  <th style={{ padding: 8 }}>Captador</th>
                  <th style={{ padding: 8 }}>Tier</th>
                  <th style={{ padding: 8 }}>Desc. / Comis.</th>
                  <th style={{ padding: 8 }}>Indicações</th>
                  <th style={{ padding: 8 }}>Saldo</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cupons.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: 8, fontFamily: 'monospace', fontWeight: 700 }}>{c.codigo}</td>
                    <td style={{ padding: 8 }}>
                      <div>{c.captadorNome || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.captadorEmail || ''}</div>
                    </td>
                    <td style={{ padding: 8, textTransform: 'capitalize' }}>{c.tier}</td>
                    <td style={{ padding: 8 }}>{c.descontoPercentual}% / {c.comissaoPercentual}%</td>
                    <td style={{ padding: 8 }}>{c.totalIndicacoes || 0}</td>
                    <td style={{ padding: 8, fontWeight: 600 }}>{brl(c.saldo?.saldoTotal || 0)}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{
                        background: c.status === 'ativo' ? '#E8F5E9' : '#FFF3E0',
                        color: c.status === 'ativo' ? '#1B5E20' : '#E65100',
                        padding: '2px 8px', borderRadius: 12, fontSize: 11,
                      }}>{c.status}</span>
                    </td>
                    <td style={{ padding: 8 }}>
                      <button type="button" onClick={() => openDetalhes(c)} style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11, marginRight: 4 }}>Detalhes</button>
                      <button type="button" onClick={() => openEdit(c)} style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11, marginRight: 4 }}>Editar</button>
                      <button type="button" onClick={() => removeCupom(c.id)} style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11, color: '#B71C1C' }}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ ...MODAL_CARD, maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 18, fontFamily: "'DM Serif Display', serif" }}>
              {editingId ? 'Editar cupom' : 'Novo cupom de captador'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>Código</label>
                <input style={INPUT} value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))} placeholder="FULANO15" disabled={editingId} />
              </div>
              <div>
                <label style={LABEL}>Tier</label>
                <select style={INPUT} value={form.tier} onChange={(e) => applyTierDefaults(e.target.value)}>
                  {Object.entries(tiers).map(([k, t]) => (
                    <option key={k} value={k}>{t.label} ({t.descontoPercentual}% / {t.comissaoPercentual}%)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL}>Nome do captador</label>
                <input style={INPUT} value={form.captadorNome} onChange={(e) => setForm((f) => ({ ...f, captadorNome: e.target.value }))} placeholder="Fulano da Silva" />
              </div>
              <div>
                <label style={LABEL}>E-mail</label>
                <input style={INPUT} type="email" value={form.captadorEmail} onChange={(e) => setForm((f) => ({ ...f, captadorEmail: e.target.value }))} placeholder="fulano@email.com" />
              </div>
              <div>
                <label style={LABEL}>Chave PIX</label>
                <input style={INPUT} value={form.pixChave} onChange={(e) => setForm((f) => ({ ...f, pixChave: e.target.value }))} placeholder="CPF/e-mail/celular/chave" />
              </div>
              <div>
                <label style={LABEL}>Status</label>
                <select style={INPUT} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Desconto cliente (%)</label>
                <input style={INPUT} type="number" min="0" max="50" value={form.descontoPercentual} onChange={(e) => setForm((f) => ({ ...f, descontoPercentual: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={LABEL}>Comissão captador (%)</label>
                <input style={INPUT} type="number" min="0" max="60" value={form.comissaoPercentual} onChange={(e) => setForm((f) => ({ ...f, comissaoPercentual: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={LABEL}>Duração comissão (meses)</label>
                <input style={INPUT} type="number" min="0" max="60" value={form.comissaoDuracaoMeses} onChange={(e) => setForm((f) => ({ ...f, comissaoDuracaoMeses: Number(e.target.value) }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LABEL}>Observação</label>
                <textarea style={{ ...INPUT, resize: 'vertical', minHeight: 60 }} value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} placeholder="Notas internas sobre este cupom" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button type="button" style={BTN_GHOST} onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="button" style={BTN_PRIMARY} onClick={saveForm} disabled={saving}>
                {saving ? 'Salvando…' : (editingId ? 'Atualizar' : 'Criar cupom')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES */}
      {detalhes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ ...MODAL_CARD, maxWidth: 800, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", fontWeight: 700 }}>{detalhes.cupom.codigo}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{detalhes.cupom.captadorNome} • {detalhes.cupom.captadorEmail}</div>
                {detalhes.cupom.pixChave && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PIX: {detalhes.cupom.pixChave}</div>}
              </div>
              <button type="button" onClick={() => setDetalhes(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saldo total</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{brl(detalhes.saldo?.saldoTotal)}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sacável</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#4CAF7D' }}>{brl(detalhes.saldo?.saldoSacavel)}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Creditado</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{brl(detalhes.saldo?.totalCreditado)}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pago</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{brl(detalhes.saldo?.totalPago)}</div>
              </div>
            </div>

            {/* Registrar Payout */}
            <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Registrar pagamento (PIX)</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ ...INPUT, flex: 1 }}
                  type="number"
                  placeholder="Valor a pagar"
                  value={payoutValor}
                  onChange={(e) => setPayoutValor(e.target.value)}
                />
                <button type="button" style={BTN_PRIMARY} onClick={registrarPayout} disabled={registrandoPayout}>
                  {registrandoPayout ? 'Registrando…' : 'Registrar payout'}
                </button>
              </div>
            </div>

            {/* Indicações */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Indicações ({detalhes.indicacoes?.length || 0})</div>
              {!detalhes.indicacoes?.length ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>Nenhuma indicação ainda.</div>
              ) : (
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line-soft)' }}>
                    <th style={{ padding: 6 }}>Data</th><th style={{ padding: 6 }}>Usuário</th>
                    <th style={{ padding: 6 }}>Plano</th><th style={{ padding: 6 }}>Valor pago</th>
                    <th style={{ padding: 6 }}>Comissão</th><th style={{ padding: 6 }}>Liberado em</th>
                  </tr></thead>
                  <tbody>
                    {detalhes.indicacoes.map((i) => (
                      <tr key={i.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        <td style={{ padding: 6 }}>{formatDate(i.createdAt)}</td>
                        <td style={{ padding: 6 }}>{i.usuarioEmail || '—'}</td>
                        <td style={{ padding: 6 }}>{i.plano}</td>
                        <td style={{ padding: 6 }}>{brl(i.valorLiquido)}</td>
                        <td style={{ padding: 6, fontWeight: 600 }}>{brl(i.comissaoCredito)}</td>
                        <td style={{ padding: 6 }}>{formatDate(i.liberadaEm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Movimentos */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Extrato ({detalhes.movimentos?.length || 0})</div>
              {!detalhes.movimentos?.length ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>Sem movimentos.</div>
              ) : (
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line-soft)' }}>
                    <th style={{ padding: 6 }}>Data</th><th style={{ padding: 6 }}>Tipo</th>
                    <th style={{ padding: 6 }}>Valor</th><th style={{ padding: 6 }}>Descrição</th>
                  </tr></thead>
                  <tbody>
                    {detalhes.movimentos.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                        <td style={{ padding: 6 }}>{formatDateTime(m.createdAt)}</td>
                        <td style={{ padding: 6, textTransform: 'capitalize' }}>{m.tipo}</td>
                        <td style={{ padding: 6, fontWeight: 600, color: Number(m.valor) < 0 ? '#B71C1C' : '#1B5E20' }}>{brl(m.valor)}</td>
                        <td style={{ padding: 6 }}>{m.descricao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
