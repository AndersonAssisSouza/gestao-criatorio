import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../../shared/StatCard'
import { useAuth } from '../../../context/AuthContext'
import { accessService } from '../../../services/access.service'
import { SUBSCRIPTION_PRICING, formatSubscriptionPrice } from '../../../config/subscription'

const PLAN_OPTIONS = [
  { key: 'monthly', title: 'Plano mensal', text: 'Ideal para começar rápido, com renovação simplificada e menor compromisso inicial.' },
  { key: 'annual', title: 'Plano anual', text: 'Melhor custo para continuidade do criatório, com 12 meses de acesso liberado.' },
]

function formatDate(value) {
  if (!value) return 'Sem vencimento'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleString('pt-BR')
}

function formatMethod(method) {
  if (method === 'pix') return 'PIX'
  if (method === 'card') return 'Cartão'
  return 'Manual'
}

function formatStatus(status) {
  if (status === 'redirect_pending') return 'Aguardando conclusão do checkout'
  if (status === 'awaiting_payment') return 'Aguardando pagamento'
  if (status === 'processing') return 'Em análise'
  if (status === 'paid') return 'Pago'
  if (status === 'rejected') return 'Recusado'
  return 'Registrado'
}

function getStatusClass(status) {
  if (status === 'paid') return 'p-alert--success'
  if (status === 'rejected') return 'p-alert--error'
  return ''
}

export function AssinaturaModule() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [checkoutInfo, setCheckoutInfo] = useState({ configured: false, provider: 'interno', reasons: [] })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmingPaymentId, setConfirmingPaymentId] = useState('')
  const [deletingPaymentId, setDeletingPaymentId] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [cardForm, setCardForm] = useState({
    cardHolderName: user?.name || '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
  })

  const loadAccess = async () => {
    setLoading(true)
    try {
      const response = await accessService.getMyAccess()
      setPayments(response.payments || [])
      setCheckoutInfo(response.checkout || { configured: false, provider: 'interno', reasons: [] })
      await refreshUser()
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível carregar sua assinatura.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccess()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutStatus = params.get('checkout')
    const providerPaymentId = params.get('payment_id')
    const externalReference = params.get('external_reference')

    if (!checkoutStatus || !externalReference) {
      return undefined
    }

    let active = true

    const reconcile = async () => {
      try {
        const response = await accessService.reconcileCheckout({
          paymentId: providerPaymentId,
          externalReference,
        })

        if (!active) return

        setSuccess(
          response.payment?.status === 'paid'
            ? 'Pagamento confirmado e acesso liberado.'
            : checkoutStatus === 'pending'
              ? 'O pagamento foi iniciado e está em processamento.'
              : 'O checkout foi encerrado. Confira o status no histórico financeiro.',
        )
        await loadAccess()
      } catch (requestError) {
        if (!active) return
        setError(requestError.response?.data?.message || 'Não foi possível reconciliar o retorno do pagamento.')
      } finally {
        const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`
        window.history.replaceState({}, document.title, cleanUrl)
      }
    }

    reconcile()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setCardForm((current) => ({
      ...current,
      cardHolderName: current.cardHolderName || user?.name || '',
    }))
  }, [user?.name])

  const access = user?.access || {}
  const canCheckout = user?.role !== 'owner'
  const usesExternalGateway = Boolean(checkoutInfo?.configured)
  const trialDays = access.remainingDays ?? 0
  const sortedPayments = useMemo(
    () => [...payments].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [payments],
  )

  const activeCheckout = sortedPayments.find((payment) => ['redirect_pending', 'awaiting_payment', 'processing'].includes(payment.status)) || null
  const selectedPrice = SUBSCRIPTION_PRICING[selectedPlan] ?? 0

  const summaryCards = useMemo(() => ([
    {
      label: 'Status',
      value: access.label || 'Carregando',
      desc: access.accessGranted ? 'acesso liberado' : 'acesso aguardando regularização',
      color: access.accessGranted ? '#4CAF7D' : '#C95025',
    },
    {
      label: 'Plano',
      value: access.plan === 'annual' ? 'Anual' : access.plan === 'monthly' ? 'Mensal' : access.plan === 'lifetime' ? 'Vitalício' : 'Trial',
      desc: 'modelo atual de acesso',
      color: '#F5A623',
    },
    {
      label: access.status === 'trialing' ? 'Dias grátis' : 'Válido até',
      value: access.status === 'trialing' ? String(trialDays) : formatDate(access.expiresAt),
      desc: access.status === 'trialing' ? 'restantes no primeiro acesso' : 'renove antes do vencimento',
      color: '#5BC0EB',
    },
  ]), [access, trialDays])

  const handleCheckout = async () => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    setCopyFeedback('')

    try {
      const payload = {
        plan: selectedPlan,
        method: paymentMethod,
      }

      if (paymentMethod === 'card') {
        Object.assign(payload, cardForm)
      }

      const response = await accessService.createCheckout(payload)
      setPayments((current) => [response.payment, ...current])
      setCheckoutInfo(response.checkout || checkoutInfo)
      await refreshUser()
      setSuccess(
        paymentMethod === 'pix'
          ? 'Cobrança PIX gerada. Assim que o pagamento for confirmado, o acesso será liberado.'
          : 'Pagamento confirmado no cartão e acesso liberado com sucesso.',
      )
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível iniciar o pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyPix = async () => {
    if (!activeCheckout?.pixCode) return

    try {
      await navigator.clipboard.writeText(activeCheckout.pixCode)
      setCopyFeedback('Código PIX copiado.')
      setTimeout(() => setCopyFeedback(''), 2500)
    } catch (_) {
      setCopyFeedback('Não foi possível copiar automaticamente.')
    }
  }

  const handleConfirmPayment = async (paymentId) => {
    setConfirmingPaymentId(paymentId)
    setError('')
    setSuccess('')

    try {
      await accessService.confirmInternalPayment(paymentId)
      await loadAccess()
      setSuccess('Pagamento confirmado e acesso liberado com sucesso.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível confirmar o pagamento.')
    } finally {
      setConfirmingPaymentId('')
    }
  }

  if (loading) {
    return <div className="module-empty">Carregando assinatura...</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Assinatura, cobrança e acesso</div>
          <h2 className="module-hero__title">Minha assinatura</h2>
          <div className="module-hero__text">
            Todo novo usuário entra com 7 dias grátis. Depois disso, você pode pagar o plano mensal ou anual por PIX ou cartão, e o acesso é liberado assim que a cobrança for confirmada.
          </div>
        </div>
        <div className="pill">{user?.role === 'owner' ? 'Conta master • acesso vitalício' : usesExternalGateway ? 'Checkout seguro via gateway' : 'Checkout integrado ao acesso'}</div>
      </div>

      {error && <div className="p-alert--error">{error}</div>}
      {success && <div className="p-alert--success">{success}</div>}

      <div className="stat-grid">
        {summaryCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} desc={card.desc} color={card.color} />
        ))}
      </div>

      <div className="billing-studio">
        <section className="billing-card">
          <div className="p-panel-header__title font-serif">Escolha seu plano</div>
          <div className="text-muted mb-2">
            {usesExternalGateway
              ? 'Selecione o plano e a forma preferida de pagamento. Você será redirecionado ao checkout seguro para concluir PIX ou cartão.'
              : 'Selecione o plano e a forma de pagamento. O checkout gera a cobrança e sua assinatura segue para conferência e liberação.'}
          </div>

          {canCheckout ? (
            <div className="flex flex-col gap-2">
              <div className="billing-plan-grid">
                {PLAN_OPTIONS.map((plan) => {
                  const isActive = selectedPlan === plan.key
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => setSelectedPlan(plan.key)}
                      className={`billing-card p-list-item${isActive ? ' is-active' : ''}`}
                    >
                      <div className="flex justify-between gap-1 mb-1">
                        <strong>{plan.title}</strong>
                        <span className="text-accent">{formatSubscriptionPrice(SUBSCRIPTION_PRICING[plan.key])}</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: 13 }}>{plan.text}</div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                {[
                  { key: 'pix', label: 'PIX' },
                  { key: 'card', label: 'Cartão de crédito' },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPaymentMethod(option.key)}
                    className={`p-btn${paymentMethod === option.key ? ' p-btn--primary' : ' p-btn--ghost'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="payment-checkout-card">
                <div className="payment-checkout-card__head">
                  <div>
                    <div className="payment-checkout-card__eyebrow">Checkout ativo</div>
                    <div className="payment-checkout-card__title">
                      {paymentMethod === 'pix' ? 'Cobrança instantânea via PIX' : 'Pagamento via cartão'}
                    </div>
                  </div>
                  <div className="pill pill--accent">{formatSubscriptionPrice(selectedPrice)}</div>
                </div>

                {paymentMethod === 'pix' ? (
                  <div className="payment-checkout-card__body">
                    <div className="text-muted">
                      {usesExternalGateway
                        ? 'O checkout seguro abrirá com foco em PIX. Depois da confirmação, o sistema reconcilia o pagamento e libera o acesso.'
                        : 'Gere um PIX de cobrança para o plano escolhido. O sistema registra a referência financeira e a sua área administrativa pode confirmar a quitação para liberar o acesso.'}
                    </div>

                    <button type="button" onClick={handleCheckout} disabled={submitting} className="p-btn p-btn--primary">
                      {submitting ? (usesExternalGateway ? 'Abrindo checkout...' : 'Gerando PIX...') : usesExternalGateway ? `Ir para o checkout PIX` : `Gerar PIX de ${formatSubscriptionPrice(selectedPrice)}`}
                    </button>

                    {!usesExternalGateway && activeCheckout?.method === 'pix' && (
                      <div className="payment-pix-panel">
                        <div className="payment-pix-panel__qr">
                          <div className="payment-pix-panel__qr-core">
                            <span>PIX</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="text-muted" style={{ fontWeight: 700 }}>Código copia e cola</div>
                          <div className="payment-code-box">{activeCheckout.pixCode}</div>
                          <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                            <button type="button" onClick={handleCopyPix} className="p-btn p-btn--primary">
                              Copiar código PIX
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmPayment(activeCheckout.id)}
                              disabled={confirmingPaymentId === activeCheckout.id}
                              className="p-btn p-btn--secondary"
                            >
                              {confirmingPaymentId === activeCheckout.id ? 'Confirmando...' : 'Já paguei, liberar acesso'}
                            </button>
                            <div className="pill">Expira em {formatDateTime(activeCheckout.pixExpiresAt)}</div>
                          </div>
                          {copyFeedback && <div className="text-success" style={{ fontSize: 12 }}>{copyFeedback}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="payment-checkout-card__body">
                    {!usesExternalGateway && (
                      <div className="payment-form-grid">
                        <label className="p-field">
                          <div className="p-label">Nome no cartão</div>
                          <input value={cardForm.cardHolderName} onChange={(event) => setCardForm((current) => ({ ...current, cardHolderName: event.target.value }))} placeholder="Nome completo" className="p-input" />
                        </label>
                        <label className="p-field">
                          <div className="p-label">Número do cartão</div>
                          <input value={cardForm.cardNumber} onChange={(event) => setCardForm((current) => ({ ...current, cardNumber: event.target.value }))} placeholder="0000 0000 0000 0000" className="p-input" />
                        </label>
                        <label className="p-field">
                          <div className="p-label">Mês</div>
                          <input value={cardForm.expiryMonth} onChange={(event) => setCardForm((current) => ({ ...current, expiryMonth: event.target.value }))} placeholder="MM" className="p-input" />
                        </label>
                        <label className="p-field">
                          <div className="p-label">Ano</div>
                          <input value={cardForm.expiryYear} onChange={(event) => setCardForm((current) => ({ ...current, expiryYear: event.target.value }))} placeholder="AAAA" className="p-input" />
                        </label>
                        <label className="p-field">
                          <div className="p-label">CVC</div>
                          <input value={cardForm.cvc} onChange={(event) => setCardForm((current) => ({ ...current, cvc: event.target.value }))} placeholder="123" className="p-input" />
                        </label>
                      </div>
                    )}

                    <div className="text-faint" style={{ fontSize: 12 }}>
                      {usesExternalGateway
                        ? 'Você será redirecionado ao ambiente seguro do gateway para concluir o pagamento com cartão.'
                        : 'Por segurança, o sistema não armazena o número completo nem o CVC do cartão. Apenas bandeira e final são registrados para conferência.'}
                    </div>

                    <button type="button" onClick={handleCheckout} disabled={submitting} className="p-btn p-btn--primary">
                      {submitting ? (usesExternalGateway ? 'Abrindo checkout...' : 'Registrando cobrança...') : usesExternalGateway ? `Ir para o checkout de cartão` : `Pagar ${formatSubscriptionPrice(selectedPrice)} no cartão`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted">
              Sua conta é a conta proprietária master do sistema. O acesso é vitalício, total e a área administrativa permanece liberada sem necessidade de cobrança.
            </div>
          )}
        </section>

        <section className="billing-card">
          <div className="p-panel-header__title font-serif">Situação financeira</div>
          <div className="text-muted mb-2">
            Acompanhe a última cobrança iniciada, o status da aprovação e todo o histórico desta conta.
          </div>

          {activeCheckout ? (
            <div className={`billing-card mb-2 ${getStatusClass(activeCheckout.status)}`}>
              <div className="flex justify-between gap-1 mb-1">
                <strong>{formatMethod(activeCheckout.method)} • {activeCheckout.plan === 'annual' ? 'Plano anual' : 'Plano mensal'}</strong>
                <span>{formatStatus(activeCheckout.status)}</span>
              </div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Referência: {activeCheckout.paymentReference || activeCheckout.id}<br />
                Valor: {formatSubscriptionPrice(activeCheckout.amount)}<br />
                Iniciado em: {formatDateTime(activeCheckout.createdAt)}
              </div>
            </div>
          ) : (
            <div className="text-faint mb-2">
              Nenhuma cobrança aberta no momento.
            </div>
          )}

          <div className="mb-1" style={{ fontWeight: 700 }}>Histórico financeiro</div>
          {sortedPayments.length === 0 ? (
            <div className="text-faint">Ainda não há pagamentos registrados para este usuário.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {sortedPayments.map((payment) => (
                <div key={payment.id} className="billing-card">
                  <div className="flex justify-between gap-1 mb-1">
                    <strong>{payment.plan === 'annual' ? 'Anual' : 'Mensal'} • {formatMethod(payment.method)}</strong>
                    <span className="text-accent">{formatSubscriptionPrice(payment.amount)}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Status: {formatStatus(payment.status)}<br />
                    Criado em {formatDateTime(payment.createdAt)}
                    {payment.paidAt ? ` • pago em ${formatDateTime(payment.paidAt)}` : ''}
                    {payment.validUntil ? ` • válido até ${formatDate(payment.validUntil)}` : ''}
                    {payment.provider ? ` • gateway ${payment.provider}` : ''}
                    {payment.cardMasked ? <><br />Cartão: {payment.cardBrand} {payment.cardMasked}</> : null}
                  </div>
                  <div style={{ marginTop: 8, textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Excluir este lançamento?')) return
                        setDeletingPaymentId(payment.id)
                        setError('')
                        setSuccess('')
                        try {
                          await accessService.deletePayment(payment.id)
                          setSuccess('Lançamento excluído.')
                          await loadAccess()
                        } catch (err) {
                          setError(err.response?.data?.message || 'Não foi possível excluir.')
                        } finally {
                          setDeletingPaymentId('')
                        }
                      }}
                      disabled={deletingPaymentId === payment.id}
                      className="p-btn p-btn--ghost"
                      style={{ fontSize: 12, color: '#C95025' }}
                    >
                      {deletingPaymentId === payment.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
