import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../../shared/StatCard'
import { useAuth } from '../../../context/AuthContext'
import { accessService } from '../../../services/access.service'
import { SUBSCRIPTION_PRICING, formatSubscriptionPrice } from '../../../config/subscription'

const CARD_STYLE = {
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.03)',
  boxShadow: 'var(--shadow-md)',
}

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

function getStatusTone(status) {
  if (status === 'paid') return { color: '#b6f1cf', borderColor: 'rgba(76,175,125,0.24)' }
  if (status === 'rejected') return { color: '#ffb9aa', borderColor: 'rgba(224,92,75,0.24)' }
  return { color: '#f4d5a7', borderColor: 'rgba(245,166,35,0.24)' }
}

export function AssinaturaModule() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [checkoutInfo, setCheckoutInfo] = useState({ configured: false, provider: 'interno', reasons: [] })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
      await refreshUser()
      setSuccess(
        paymentMethod === 'pix'
          ? 'Cobrança PIX gerada. Assim que o pagamento for confirmado, o acesso será liberado.'
          : 'Solicitação no cartão registrada. O pagamento agora fica disponível para conferência e aprovação.',
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

  if (loading) {
    return <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Carregando assinatura...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
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

      {error && <div style={{ ...CARD_STYLE, padding: 16, color: '#ffb9aa', borderColor: 'rgba(224,92,75,0.24)' }}>{error}</div>}
      {success && <div style={{ ...CARD_STYLE, padding: 16, color: '#b6f1cf', borderColor: 'rgba(76,175,125,0.24)' }}>{success}</div>}

      <div className="stat-grid">
        {summaryCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} desc={card.desc} color={card.color} />
        ))}
      </div>

      <div className="billing-studio">
        <section className="module-panel" style={{ ...CARD_STYLE, padding: 22 }}>
          <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>Escolha seu plano</div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 18 }}>
            {usesExternalGateway
              ? 'Selecione o plano e a forma preferida de pagamento. Você será redirecionado ao checkout seguro para concluir PIX ou cartão.'
              : 'Selecione o plano e a forma de pagamento. O checkout gera a cobrança e sua assinatura segue para conferência e liberação.'}
          </div>

          {canCheckout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="billing-plan-grid">
                {PLAN_OPTIONS.map((plan) => {
                  const isActive = selectedPlan === plan.key
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => setSelectedPlan(plan.key)}
                      style={{
                        ...CARD_STYLE,
                        padding: 18,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderColor: isActive ? 'rgba(201,80,37,0.24)' : 'rgba(255,255,255,0.06)',
                        background: isActive ? 'rgba(201,80,37,0.08)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <strong>{plan.title}</strong>
                        <span style={{ color: 'var(--accent-light)' }}>{formatSubscriptionPrice(SUBSCRIPTION_PRICING[plan.key])}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>{plan.text}</div>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { key: 'pix', label: 'PIX' },
                  { key: 'card', label: 'Cartão de crédito' },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPaymentMethod(option.key)}
                    style={{
                      minHeight: 44,
                      padding: '0 16px',
                      borderRadius: 14,
                      border: paymentMethod === option.key ? '1px solid rgba(201,80,37,0.26)' : '1px solid rgba(255,255,255,0.08)',
                      background: paymentMethod === option.key ? 'rgba(201,80,37,0.12)' : 'rgba(255,255,255,0.03)',
                      color: paymentMethod === option.key ? 'var(--accent-contrast)' : 'var(--text-soft)',
                      cursor: 'pointer',
                    }}
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
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                      {usesExternalGateway
                        ? 'O checkout seguro abrirá com foco em PIX. Depois da confirmação, o sistema reconcilia o pagamento e libera o acesso.'
                        : 'Gere um PIX de cobrança para o plano escolhido. O sistema registra a referência financeira e a sua área administrativa pode confirmar a quitação para liberar o acesso.'}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setSubmitting(true)
                        setError('')
                        setSuccess('')
                        setCopyFeedback('')

                        try {
                          const response = await accessService.createCheckout({ plan: selectedPlan, method: paymentMethod })
                          setPayments((current) => [response.payment, ...current])
                          setCheckoutInfo(response.checkout || checkoutInfo)
                          await refreshUser()

                          if (response.checkout?.redirectUrl) {
                            window.location.href = response.checkout.redirectUrl
                            return
                          }

                          setSuccess('Cobrança PIX gerada. Assim que o pagamento for confirmado, o acesso será liberado.')
                        } catch (requestError) {
                          setError(requestError.response?.data?.message || 'Não foi possível iniciar o pagamento.')
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                      disabled={submitting}
                      className="theme-action-btn"
                    >
                      {submitting ? (usesExternalGateway ? 'Abrindo checkout...' : 'Gerando PIX...') : usesExternalGateway ? `Ir para o checkout PIX` : `Gerar PIX de ${formatSubscriptionPrice(selectedPrice)}`}
                    </button>

                    {!usesExternalGateway && activeCheckout?.method === 'pix' && (
                      <div className="payment-pix-panel">
                        <div className="payment-pix-panel__qr">
                          <div className="payment-pix-panel__qr-core">
                            <span>PIX</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ color: 'var(--text-soft)', fontWeight: 700 }}>Código copia e cola</div>
                          <div className="payment-code-box">{activeCheckout.pixCode}</div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button type="button" onClick={handleCopyPix} className="theme-action-btn">
                              Copiar código PIX
                            </button>
                            <div className="pill">Expira em {formatDateTime(activeCheckout.pixExpiresAt)}</div>
                          </div>
                          {copyFeedback && <div style={{ color: 'var(--support-light)', fontSize: 12 }}>{copyFeedback}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="payment-checkout-card__body">
                    {!usesExternalGateway && (
                      <div className="payment-form-grid">
                        <label>
                          <div className="payment-field__label">Nome no cartão</div>
                          <input value={cardForm.cardHolderName} onChange={(event) => setCardForm((current) => ({ ...current, cardHolderName: event.target.value }))} placeholder="Nome completo" className="payment-field" />
                        </label>
                        <label>
                          <div className="payment-field__label">Número do cartão</div>
                          <input value={cardForm.cardNumber} onChange={(event) => setCardForm((current) => ({ ...current, cardNumber: event.target.value }))} placeholder="0000 0000 0000 0000" className="payment-field" />
                        </label>
                        <label>
                          <div className="payment-field__label">Mês</div>
                          <input value={cardForm.expiryMonth} onChange={(event) => setCardForm((current) => ({ ...current, expiryMonth: event.target.value }))} placeholder="MM" className="payment-field" />
                        </label>
                        <label>
                          <div className="payment-field__label">Ano</div>
                          <input value={cardForm.expiryYear} onChange={(event) => setCardForm((current) => ({ ...current, expiryYear: event.target.value }))} placeholder="AAAA" className="payment-field" />
                        </label>
                        <label>
                          <div className="payment-field__label">CVC</div>
                          <input value={cardForm.cvc} onChange={(event) => setCardForm((current) => ({ ...current, cvc: event.target.value }))} placeholder="123" className="payment-field" />
                        </label>
                      </div>
                    )}

                    <div style={{ color: 'var(--text-faint)', fontSize: 12, lineHeight: 1.8 }}>
                      {usesExternalGateway
                        ? 'Você será redirecionado ao ambiente seguro do gateway para concluir o pagamento com cartão.'
                        : 'Por segurança, o sistema não armazena o número completo nem o CVC do cartão. Apenas bandeira e final são registrados para conferência.'}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setSubmitting(true)
                        setError('')
                        setSuccess('')

                        try {
                          const payload = { plan: selectedPlan, method: paymentMethod }
                          if (!usesExternalGateway) Object.assign(payload, cardForm)
                          const response = await accessService.createCheckout(payload)
                          setPayments((current) => [response.payment, ...current])
                          setCheckoutInfo(response.checkout || checkoutInfo)
                          await refreshUser()

                          if (response.checkout?.redirectUrl) {
                            window.location.href = response.checkout.redirectUrl
                            return
                          }

                          setSuccess('Solicitação no cartão registrada. O pagamento agora fica disponível para conferência e aprovação.')
                        } catch (requestError) {
                          setError(requestError.response?.data?.message || 'Não foi possível iniciar o pagamento.')
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                      disabled={submitting}
                      className="theme-action-btn"
                    >
                      {submitting ? (usesExternalGateway ? 'Abrindo checkout...' : 'Registrando cobrança...') : usesExternalGateway ? `Ir para o checkout de cartão` : `Pagar ${formatSubscriptionPrice(selectedPrice)} no cartão`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Sua conta é a conta proprietária master do sistema. O acesso é vitalício, total e a área administrativa permanece liberada sem necessidade de cobrança.
            </div>
          )}
        </section>

        <section className="module-panel" style={{ ...CARD_STYLE, padding: 22 }}>
          <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>Situação financeira</div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            Acompanhe a última cobrança iniciada, o status da aprovação e todo o histórico desta conta.
          </div>

          {activeCheckout ? (
            <div style={{ ...CARD_STYLE, padding: 16, marginBottom: 16, ...getStatusTone(activeCheckout.status) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <strong>{formatMethod(activeCheckout.method)} • {activeCheckout.plan === 'annual' ? 'Plano anual' : 'Plano mensal'}</strong>
                <span>{formatStatus(activeCheckout.status)}</span>
              </div>
              <div style={{ color: 'inherit', fontSize: 13, lineHeight: 1.8 }}>
                Referência: {activeCheckout.paymentReference || activeCheckout.id}<br />
                Valor: {formatSubscriptionPrice(activeCheckout.amount)}<br />
                Iniciado em: {formatDateTime(activeCheckout.createdAt)}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-faint)', lineHeight: 1.8, marginBottom: 16 }}>
              Nenhuma cobrança aberta no momento.
            </div>
          )}

          <div style={{ color: 'var(--text-soft)', fontWeight: 700, marginBottom: 12 }}>Histórico financeiro</div>
          {sortedPayments.length === 0 ? (
            <div style={{ color: 'var(--text-faint)', lineHeight: 1.8 }}>Ainda não há pagamentos registrados para este usuário.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedPayments.map((payment) => (
                <div key={payment.id} style={{ ...CARD_STYLE, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <strong>{payment.plan === 'annual' ? 'Anual' : 'Mensal'} • {formatMethod(payment.method)}</strong>
                    <span style={{ color: 'var(--accent-light)' }}>{formatSubscriptionPrice(payment.amount)}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
                    Status: {formatStatus(payment.status)}<br />
                    Criado em {formatDateTime(payment.createdAt)}
                    {payment.paidAt ? ` • pago em ${formatDateTime(payment.paidAt)}` : ''}
                    {payment.validUntil ? ` • válido até ${formatDate(payment.validUntil)}` : ''}
                    {payment.provider ? ` • gateway ${payment.provider}` : ''}
                    {payment.cardMasked ? <><br />Cartão: {payment.cardBrand} {payment.cardMasked}</> : null}
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
