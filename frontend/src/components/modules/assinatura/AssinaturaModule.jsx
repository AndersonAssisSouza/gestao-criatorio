import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../../shared/StatCard'
import { useAuth } from '../../../context/AuthContext'
import { accessService } from '../../../services/access.service'
import { SUBSCRIPTION_PRICING, formatSubscriptionPrice } from '../../../config/subscription'

const PLAN_OPTIONS = [
  { key: 'monthly', title: 'Plano mensal', price: SUBSCRIPTION_PRICING.monthly, text: 'Renovação simplificada a cada 30 dias.' },
  { key: 'annual', title: 'Plano anual', price: SUBSCRIPTION_PRICING.annual, text: '12 meses de acesso com melhor custo.' },
]

function formatDate(v) { return v ? new Date(v).toLocaleDateString('pt-BR') : 'Sem vencimento' }
function formatDateTime(v) { return v ? new Date(v).toLocaleString('pt-BR') : 'Sem data' }
function formatMethod(m) { return m === 'pix' ? 'PIX' : m === 'card' ? 'Cartão' : 'Manual' }
function formatStatus(s) {
  const map = { redirect_pending: 'Aguardando checkout', awaiting_payment: 'Aguardando pagamento', processing: 'Em análise', paid: 'Pago', rejected: 'Recusado' }
  return map[s] || 'Registrado'
}

function maskCard(num) {
  const d = (num || '').replace(/\D/g, '')
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function AssinaturaModule() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [checkoutInfo, setCheckoutInfo] = useState({ configured: false })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmingId, setConfirmingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [cancellingPlan, setCancellingPlan] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelStep, setCancelStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [method, setMethod] = useState('pix')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [card, setCard] = useState({ name: user?.name || '', number: '', month: '', year: '', cvc: '' })

  const loadAccess = async () => {
    setLoading(true)
    try {
      const r = await accessService.getMyAccess()
      setPayments(r.payments || [])
      setCheckoutInfo(r.checkout || { configured: false })
      await refreshUser()
      setError('')
    } catch (e) {
      setError(e.response?.data?.message || 'Não foi possível carregar sua assinatura.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAccess() }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const status = p.get('checkout'), pid = p.get('payment_id'), ref = p.get('external_reference')
    if (!status || !ref) return
    let active = true
    ;(async () => {
      try {
        const r = await accessService.reconcileCheckout({ paymentId: pid, externalReference: ref })
        if (!active) return
        setSuccess(r.payment?.status === 'paid' ? 'Pagamento confirmado e acesso liberado.' : 'Checkout encerrado. Confira o histórico.')
        await loadAccess()
      } catch (e) { if (active) setError(e.response?.data?.message || 'Erro ao reconciliar pagamento.') }
      finally { window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash || ''}`) }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => { setCard(c => ({ ...c, name: c.name || user?.name || '' })) }, [user?.name])

  const access = user?.access || {}
  const isOwner = user?.role === 'owner'
  const usesGateway = Boolean(checkoutInfo?.configured)
  const sorted = useMemo(() => [...payments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [payments])
  const activeCheckout = sorted.find(p => ['redirect_pending', 'awaiting_payment', 'processing'].includes(p.status)) || null
  const price = SUBSCRIPTION_PRICING[selectedPlan] ?? 0
  const hasActivePlan = access.accessGranted && access.status === 'active' && ['monthly', 'annual'].includes(access.plan)

  const stats = useMemo(() => [
    { label: 'Status', value: access.label || 'Carregando', desc: access.accessGranted ? 'acesso liberado' : 'acesso bloqueado', color: access.accessGranted ? '#4CAF7D' : '#C95025' },
    { label: 'Plano', value: access.plan === 'annual' ? 'Anual' : access.plan === 'monthly' ? 'Mensal' : access.plan === 'lifetime' ? 'Vitalício' : 'Trial', desc: 'modelo atual', color: '#F5A623' },
    { label: access.status === 'trialing' ? 'Dias grátis' : 'Válido até', value: access.status === 'trialing' ? String(access.remainingDays ?? 0) : formatDate(access.expiresAt), desc: access.status === 'trialing' ? 'restantes no trial' : 'renove antes do vencimento', color: '#5BC0EB' },
  ], [access])

  const cardValid = card.name.length > 2 && card.number.replace(/\D/g, '').length >= 13 && card.month && card.year && card.cvc.length >= 3

  const handleCheckout = async () => {
    if (method === 'card' && !cardValid) {
      setError('Preencha todos os campos do cartão corretamente.')
      return
    }
    setSubmitting(true); setError(''); setSuccess(''); setCopyFeedback('')
    try {
      const payload = { plan: selectedPlan, method }
      if (method === 'card') Object.assign(payload, { cardHolderName: card.name, cardNumber: card.number.replace(/\D/g, ''), expiryMonth: card.month, expiryYear: card.year, cvc: card.cvc })
      const r = await accessService.createCheckout(payload)

      // Se o gateway retornou URL de redirect (MercadoPago), redireciona o usuário
      if (r.checkout?.redirectUrl) {
        window.location.href = r.checkout.redirectUrl
        return
      }

      setPayments(cur => [r.payment, ...cur])
      setCheckoutInfo(r.checkout || checkoutInfo)
      await refreshUser()

      if (r.payment?.status === 'paid' || r.access) {
        setSuccess('Pagamento confirmado e acesso liberado!')
        if (method === 'card') setCard({ name: user?.name || '', number: '', month: '', year: '', cvc: '' })
      } else if (method === 'pix') {
        setSuccess('Cobrança PIX gerada. Confirme o pagamento abaixo para liberar o acesso.')
      } else {
        setSuccess('Pagamento registrado. Aguarde a confirmação.')
      }
    } catch (e) { setError(e.response?.data?.message || 'Erro ao processar pagamento.') }
    finally { setSubmitting(false) }
  }

  const handleConfirm = async (id) => {
    setConfirmingId(id); setError(''); setSuccess('')
    try { await accessService.confirmInternalPayment(id); await loadAccess(); setSuccess('Pagamento confirmado e acesso liberado!') }
    catch (e) { setError(e.response?.data?.message || 'Erro ao confirmar.') }
    finally { setConfirmingId('') }
  }

  const handleCancelPlan = async () => {
    setCancellingPlan(true); setError(''); setSuccess('')
    try {
      const r = await accessService.cancelMySubscription(cancelReason)
      await loadAccess()
      setShowCancelModal(false)
      setCancelStep(1)
      setCancelReason('')
      setSuccess(r.cancellation?.message || 'Cancelamento registrado. Seu acesso permanece ativo até o fim do período pago.')
    } catch (e) { setError(e.response?.data?.message || 'Erro ao cancelar.') }
    finally { setCancellingPlan(false) }
  }

  if (loading) return <div className="module-empty">Carregando assinatura...</div>

  return (
    <div className="flex flex-col gap-3">
      {/* Hero */}
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Assinatura, cobrança e acesso</div>
          <h2 className="module-hero__title">Minha assinatura</h2>
          <div className="module-hero__text">
            Novo usuário entra com 7 dias grátis. Depois, escolha mensal ou anual, pague por PIX ou cartão e o acesso é liberado na hora.
          </div>
        </div>
        <div className="pill">{isOwner ? 'Conta master • vitalício' : usesGateway ? 'MercadoPago ativo' : 'Checkout integrado'}</div>
      </div>

      {error && <div className="p-alert--error">{error}</div>}
      {success && <div className="p-alert--success">{success}</div>}

      {/* Stats */}
      <div className="p-stats">
        {stats.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="billing-studio">
        {/* ── Escolha de plano ── */}
        <section className="billing-card">
          <div className="p-panel-header__title font-serif">Escolha seu plano</div>
          <div className="text-muted mb-2">Selecione o plano e a forma de pagamento.</div>

          <div className="flex flex-col gap-2">
            {/* Planos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PLAN_OPTIONS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedPlan(p.key)}
                  className="billing-card"
                  style={{
                    cursor: 'pointer',
                    border: selectedPlan === p.key ? '2px solid var(--accent)' : '1px solid var(--line-soft)',
                    background: selectedPlan === p.key ? 'var(--accent-ghost)' : 'var(--bg-panel-solid)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong>{p.title}</strong>
                    <span className="text-accent" style={{ fontWeight: 700 }}>{formatSubscriptionPrice(p.price)}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 13 }}>{p.text}</div>
                </button>
              ))}
            </div>

            {/* Método */}
            <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
              {[{ k: 'pix', l: '◉ PIX' }, { k: 'card', l: '▤ Cartão de crédito' }].map(o => (
                <button key={o.k} type="button" onClick={() => setMethod(o.k)}
                  className={`p-btn${method === o.k ? ' p-btn--primary' : ' p-btn--ghost'}`}>
                  {o.l}
                </button>
              ))}
            </div>

            {/* Checkout PIX */}
            {method === 'pix' && (
              <div className="billing-card" style={{ background: 'var(--bg-panel-solid)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div className="text-faint" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Pagamento</div>
                    <strong>Cobrança instantânea via PIX</strong>
                  </div>
                  <div className="pill pill--accent">{formatSubscriptionPrice(price)}</div>
                </div>

                <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                  {usesGateway
                    ? 'Você será redirecionado ao MercadoPago para concluir o pagamento PIX com segurança.'
                    : 'Clique para gerar o código PIX. Copie o código, faça o pagamento no seu banco e depois confirme aqui.'
                  }
                </div>

                <button type="button" onClick={handleCheckout} disabled={submitting} className="p-btn p-btn--primary" style={{ width: '100%' }}>
                  {submitting ? (usesGateway ? 'Redirecionando...' : 'Gerando PIX...') : usesGateway ? `Pagar ${formatSubscriptionPrice(price)} via MercadoPago` : `Gerar PIX de ${formatSubscriptionPrice(price)}`}
                </button>

                {activeCheckout?.method === 'pix' && (
                  <div style={{ marginTop: 16, padding: 16, background: 'var(--accent-ghost)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--accent)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {/* QR visual */}
                      <div style={{ flex: '0 0 100px', height: 100, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent)' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>PIX</div>
                          <div style={{ fontSize: 9, color: '#888' }}>QR Code</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Código copia e cola</div>
                        <div style={{ fontSize: 11, wordBreak: 'break-all', padding: '8px 10px', background: '#fff', borderRadius: 6, border: '1px solid var(--line-soft)', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                          {activeCheckout.pixCode}
                        </div>
                        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                          <button type="button" onClick={async () => {
                            try { await navigator.clipboard.writeText(activeCheckout.pixCode); setCopyFeedback('Copiado!'); setTimeout(() => setCopyFeedback(''), 2500) }
                            catch { setCopyFeedback('Não foi possível copiar.') }
                          }} className="p-btn p-btn--ghost" style={{ fontSize: 12 }}>
                            Copiar código
                          </button>
                          <button type="button" onClick={() => handleConfirm(activeCheckout.id)} disabled={confirmingId === activeCheckout.id}
                            className="p-btn p-btn--primary" style={{ fontSize: 12 }}>
                            {confirmingId === activeCheckout.id ? 'Confirmando...' : '✓ Já paguei, liberar acesso'}
                          </button>
                        </div>
                        {copyFeedback && <div className="text-success" style={{ fontSize: 11, marginTop: 4 }}>{copyFeedback}</div>}
                        <div className="text-faint" style={{ fontSize: 11, marginTop: 6 }}>Expira em {formatDateTime(activeCheckout.pixExpiresAt)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Cartão */}
            {method === 'card' && (
              <div className="billing-card" style={{ background: 'var(--bg-panel-solid)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div className="text-faint" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Pagamento</div>
                    <strong>Pagamento via cartão de crédito</strong>
                  </div>
                  <div className="pill pill--accent">{formatSubscriptionPrice(price)}</div>
                </div>

                {!usesGateway && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <label className="p-field" style={{ gridColumn: '1 / -1' }}>
                      <div className="p-label">Nome no cartão</div>
                      <input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} placeholder="Nome completo" className="p-input" />
                    </label>
                    <label className="p-field" style={{ gridColumn: '1 / -1' }}>
                      <div className="p-label">Número do cartão</div>
                      <input value={maskCard(card.number)} onChange={e => setCard(c => ({ ...c, number: e.target.value }))} placeholder="0000 0000 0000 0000" className="p-input" maxLength={19} />
                    </label>
                    <label className="p-field">
                      <div className="p-label">Validade (MM/AA)</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={card.month} onChange={e => setCard(c => ({ ...c, month: e.target.value }))} placeholder="MM" className="p-input" maxLength={2} style={{ width: 60, textAlign: 'center' }} />
                        <span style={{ alignSelf: 'center', color: '#999' }}>/</span>
                        <input value={card.year} onChange={e => setCard(c => ({ ...c, year: e.target.value }))} placeholder="AA" className="p-input" maxLength={4} style={{ width: 70, textAlign: 'center' }} />
                      </div>
                    </label>
                    <label className="p-field">
                      <div className="p-label">CVC</div>
                      <input value={card.cvc} onChange={e => setCard(c => ({ ...c, cvc: e.target.value }))} placeholder="123" className="p-input" maxLength={4} type="password" style={{ width: 80 }} />
                    </label>
                  </div>
                )}

                <div className="text-faint mb-2" style={{ fontSize: 11 }}>
                  {usesGateway
                    ? 'Você será redirecionado ao MercadoPago para inserir os dados do cartão com total segurança.'
                    : 'O sistema não armazena o número completo nem o CVC. Apenas bandeira e final ficam registrados.'
                  }
                </div>

                <button type="button" onClick={handleCheckout} disabled={submitting || (!usesGateway && !cardValid)} className="p-btn p-btn--primary" style={{ width: '100%' }}>
                  {submitting ? (usesGateway ? 'Redirecionando...' : 'Processando pagamento...') : usesGateway ? `Pagar ${formatSubscriptionPrice(price)} via MercadoPago` : `Pagar ${formatSubscriptionPrice(price)} no cartão`}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Situação financeira ── */}
        <section className="billing-card">
          <div className="p-panel-header__title font-serif">Situação financeira</div>
          <div className="text-muted mb-2">Cobrança ativa, histórico e cancelamento.</div>

          {activeCheckout && (
            <div className="billing-card mb-2" style={{ borderLeft: '3px solid var(--accent)' }}>
              <div className="flex justify-between gap-1 mb-1">
                <strong>{formatMethod(activeCheckout.method)} • {activeCheckout.plan === 'annual' ? 'Anual' : 'Mensal'}</strong>
                <span className="pill">{formatStatus(activeCheckout.status)}</span>
              </div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Ref: {activeCheckout.paymentReference || activeCheckout.id} • {formatSubscriptionPrice(activeCheckout.amount)} • {formatDateTime(activeCheckout.createdAt)}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div className="mb-1" style={{ fontWeight: 700 }}>Histórico financeiro</div>
          {sorted.length === 0 ? (
            <div className="text-faint">Nenhum pagamento registrado.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {sorted.map(p => (
                <div key={p.id} className="billing-card" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13 }}>{p.plan === 'annual' ? 'Anual' : 'Mensal'} • {formatMethod(p.method)}</strong>
                    <span className="text-accent" style={{ fontSize: 13, fontWeight: 700 }}>{formatSubscriptionPrice(p.amount)}</span>
                    <span className={`pill${p.status === 'paid' ? '' : ''}`} style={{
                      fontSize: 10,
                      background: p.status === 'paid' ? '#e8f5e9' : p.status === 'rejected' ? '#fbe9e7' : 'var(--accent-ghost)',
                      color: p.status === 'paid' ? '#2e7d32' : p.status === 'rejected' ? '#c62828' : 'inherit',
                    }}>
                      {formatStatus(p.status)}
                    </span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {formatDateTime(p.createdAt)}
                    {p.paidAt ? ` • pago em ${formatDateTime(p.paidAt)}` : ''}
                    {p.validUntil ? ` • até ${formatDate(p.validUntil)}` : ''}
                    {p.cardMasked ? ` • ${p.cardBrand} ${p.cardMasked}` : ''}
                  </div>
                  <div style={{ marginTop: 6, textAlign: 'right' }}>
                    <button type="button" onClick={async () => {
                      if (!window.confirm('Excluir este lançamento?')) return
                      setDeletingId(p.id); setError(''); setSuccess('')
                      try { await accessService.deletePayment(p.id); setSuccess('Excluído.'); await loadAccess() }
                      catch (e) { setError(e.response?.data?.message || 'Erro ao excluir.') }
                      finally { setDeletingId('') }
                    }} disabled={deletingId === p.id} className="p-btn p-btn--ghost" style={{ fontSize: 11, color: '#C95025' }}>
                      {deletingId === p.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cancelar assinatura */}
          {hasActivePlan && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
              <div style={{ fontWeight: 700, color: '#C95025', marginBottom: 4 }}>Cancelar assinatura</div>
              <div className="text-muted mb-1" style={{ fontSize: 13 }}>
                Ao cancelar, seu acesso permanece ativo até o fim do período já pago. Você pode reativar a qualquer momento.
              </div>
              <button type="button" onClick={() => { setShowCancelModal(true); setCancelStep(1); setCancelReason('') }}
                className="p-btn p-btn--ghost" style={{ color: '#C95025', borderColor: '#C95025' }}>
                Solicitar cancelamento
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}>
          <div style={{ background: 'var(--bg-panel-solid, #fff)', borderRadius: 12, maxWidth: 520, width: '100%', padding: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflow: 'auto' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#C95025' }}>Cancelamento de assinatura</h3>
              <button type="button" onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999', padding: 4 }}>✕</button>
            </div>

            <div style={{ padding: '16px 24px 24px' }}>
              {cancelStep === 1 && (
                <>
                  <div style={{ padding: 16, background: '#fff8e1', borderRadius: 8, borderLeft: '3px solid #f57c00', marginBottom: 16 }}>
                    <strong style={{ display: 'block', marginBottom: 6, color: '#e65100' }}>Antes de continuar, leia com atenção:</strong>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: '#333' }}>
                      <li>Seu acesso permanece <strong>ativo até o fim do período já pago</strong> ({formatDate(access.expiresAt)}).</li>
                      <li>Após essa data, o acesso aos módulos será encerrado.</li>
                      <li>Seus dados ficam preservados por <strong>90 dias</strong> após o encerramento.</li>
                      <li>Você pode <strong>reativar sua assinatura</strong> a qualquer momento, sem perda de dados.</li>
                      <li><strong>Direito de arrependimento (CDC):</strong> se a compra foi feita há menos de 7 dias, você pode solicitar reembolso integral.</li>
                      <li><strong>Não há multa</strong> por cancelamento.</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Pode nos dizer o motivo? (opcional)</label>
                    <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--line-soft, #ddd)', fontSize: 14, background: 'var(--bg-panel-solid, #fff)' }}>
                      <option value="">Selecione um motivo...</option>
                      <option value="preco">Preço alto demais</option>
                      <option value="nao_uso">Não estou usando o sistema</option>
                      <option value="funcionalidades">Faltam funcionalidades que preciso</option>
                      <option value="dificuldade">Dificuldade de uso</option>
                      <option value="alternativa">Encontrei uma alternativa melhor</option>
                      <option value="temporario">Pausa temporária no criatório</option>
                      <option value="outro">Outro motivo</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowCancelModal(false)} className="p-btn p-btn--ghost">
                      Manter assinatura
                    </button>
                    <button type="button" onClick={() => setCancelStep(2)} className="p-btn" style={{ background: '#C95025', color: '#fff' }}>
                      Continuar com cancelamento
                    </button>
                  </div>
                </>
              )}

              {cancelStep === 2 && (
                <>
                  <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>Tem certeza que deseja cancelar?</h4>
                    <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                      Seu acesso permanece ativo até <strong>{formatDate(access.expiresAt)}</strong>.<br />
                      Você receberá um e-mail confirmando o cancelamento.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button type="button" onClick={() => setCancelStep(1)} className="p-btn p-btn--ghost">
                      Voltar
                    </button>
                    <button type="button" onClick={handleCancelPlan} disabled={cancellingPlan}
                      className="p-btn" style={{ background: '#C95025', color: '#fff', minWidth: 180 }}>
                      {cancellingPlan ? 'Processando...' : 'Confirmar cancelamento'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
