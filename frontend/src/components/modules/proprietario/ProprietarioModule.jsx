import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../../shared/StatCard'
import { accessService } from '../../../services/access.service'
import { SUBSCRIPTION_PRICING, formatSubscriptionPrice } from '../../../config/subscription'

function formatDate(value) {
  if (!value) return 'Sem vencimento'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleString('pt-BR')
}

function formatStatus(status) {
  if (status === 'redirect_pending') return 'Aguardando conclusão do checkout'
  if (status === 'awaiting_payment') return 'Aguardando pagamento'
  if (status === 'processing') return 'Em análise'
  if (status === 'paid') return 'Pago'
  if (status === 'rejected') return 'Recusado'
  return 'Registrado'
}

function formatMethod(method) {
  if (method === 'pix') return 'PIX'
  if (method === 'card') return 'Cartão'
  return 'Manual'
}

export function ProprietarioModule() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [granting, setGranting] = useState('')
  const [processingPaymentId, setProcessingPaymentId] = useState('')
  const [extendingTrial, setExtendingTrial] = useState(false)
  const [trialDays, setTrialDays] = useState(7)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await accessService.listSubscribers()
      setUsers(response.users || [])
      setPayments(response.payments || [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível carregar a área do proprietário.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => ({
    total: users.filter((user) => user.role !== 'owner').length,
    ativos: users.filter((user) => user.access?.accessGranted && user.role !== 'owner').length,
    pendentes: payments.filter((payment) => ['redirect_pending', 'awaiting_payment', 'processing'].includes(payment.status)).length,
    trial: users.filter((user) => user.access?.status === 'trialing').length,
  }), [payments, users])

  const selectedUser = users.find((user) => user.id === selectedUserId) || users.find((user) => user.role !== 'owner') || null

  useEffect(() => {
    if (!selectedUserId && selectedUser?.id) {
      setSelectedUserId(selectedUser.id)
    }
  }, [selectedUser, selectedUserId])

  const selectedUserPayments = useMemo(
    () => payments
      .filter((payment) => payment.userId === selectedUser?.id)
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [payments, selectedUser?.id],
  )

  const pendingPayments = selectedUserPayments.filter((payment) => ['redirect_pending', 'awaiting_payment', 'processing'].includes(payment.status))

  const handleGrant = async (plan) => {
    if (!selectedUser) return

    setGranting(plan)
    setError('')
    setSuccess('')

    const amount = SUBSCRIPTION_PRICING[plan] ?? 0

    try {
      await accessService.grantAccess(selectedUser.id, {
        plan,
        amount,
        notes: `Liberação manual registrada pelo proprietário (${plan}).`,
      })
      setSuccess(`Acesso ${plan === 'annual' ? 'anual' : plan === 'monthly' ? 'mensal' : 'vitalício'} liberado com sucesso.`)
      await loadData()
      setSelectedUserId(selectedUser.id)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível registrar o pagamento.')
    } finally {
      setGranting('')
    }
  }

  const handleApprovePayment = async (paymentId) => {
    setProcessingPaymentId(paymentId)
    setError('')
    setSuccess('')

    try {
      await accessService.approvePayment(paymentId)
      setSuccess('Pagamento confirmado e acesso liberado com sucesso.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível aprovar o pagamento.')
    } finally {
      setProcessingPaymentId('')
    }
  }

  const handleRejectPayment = async (paymentId) => {
    setProcessingPaymentId(paymentId)
    setError('')
    setSuccess('')

    try {
      await accessService.rejectPayment(paymentId)
      setSuccess('Pagamento recusado e assinatura marcada para regularização.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível recusar o pagamento.')
    } finally {
      setProcessingPaymentId('')
    }
  }

  if (loading) {
    return <div className="module-empty">Carregando controle do proprietário...</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Área exclusiva do proprietário</div>
          <h2 className="module-hero__title">Cobranças, pagamentos e acessos</h2>
          <div className="module-hero__text">
            Gerencie a base de assinantes, valide PIX e cartão, acompanhe a trilha financeira e libere o acesso apenas após a confirmação do pagamento.
          </div>
        </div>
        <div className="pill">Somente Anderson</div>
      </div>

      {error && <div className="p-alert--error">{error}</div>}
      {success && <div className="p-alert--success">{success}</div>}

      <div className="stat-grid">
        <StatCard label="Clientes" value={stats.total} desc="usuarios cadastrados" color="#C95025" />
        <StatCard label="Ativos" value={stats.ativos} desc="acesso liberado" color="#4CAF7D" />
        <StatCard label="Cobranças" value={stats.pendentes} desc="pendentes de conferência" color="#F5A623" />
        <StatCard label="Trial" value={stats.trial} desc="7 dias gratuitos" color="#5BC0EB" />
      </div>

      <div className="billing-studio">
        <section className="billing-card">
          <div className="p-panel-header__title font-serif mb-2">Base de assinantes</div>
          <div className="p-panel-list">
            {users.filter((user) => user.role !== 'owner').map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`p-list-item${selectedUserId === user.id ? ' is-active' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', textAlign: 'left', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ flex: '0 0 auto' }}>{user.name}</strong>
                  <span
                    className={user.access?.accessGranted ? 'text-success' : 'text-danger'}
                    style={{ flex: '0 0 auto', fontSize: 12, fontWeight: 600 }}
                  >
                    {user.access?.label || 'Sem status'}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{user.email}</div>
                <div className="text-faint" style={{ fontSize: 12, marginTop: 2 }}>
                  Plano {user.access?.plan || 'trial'} • expira em {formatDate(user.access?.expiresAt)}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="billing-card">
          <div className="p-panel-header__title font-serif mb-1">Aprovação financeira</div>
          {!selectedUser ? (
            <div className="text-muted">Nenhum assinante disponível ainda.</div>
          ) : (
            <>
              <div className="text-muted mb-2">
                <strong>{selectedUser.name}</strong><br />
                {selectedUser.email}<br />
                Status atual: {selectedUser.access?.label || 'Sem status'}<br />
                Solicitação aberta: {selectedUser.subscriptionRequestedPlan || 'nenhuma'}
              </div>

              {pendingPayments.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="billing-card">
                      <div className="flex justify-between gap-1 mb-1">
                        <strong>{payment.plan === 'annual' ? 'Plano anual' : 'Plano mensal'} • {formatMethod(payment.method)}</strong>
                        <span className="text-accent">{formatSubscriptionPrice(payment.amount)}</span>
                      </div>
                      <div className="text-muted mb-1" style={{ fontSize: 13 }}>
                        Status: {formatStatus(payment.status)}<br />
                        Referência: {payment.paymentReference || payment.id}<br />
                        Criado em: {formatDateTime(payment.createdAt)}
                        {payment.cardMasked ? <><br />Cartão: {payment.cardBrand} {payment.cardMasked}</> : null}
                        {payment.pixCode ? <><br />PIX: {payment.pixCode}</> : null}
                      </div>
                      <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={processingPaymentId === payment.id}
                          className="p-btn p-btn--primary"
                        >
                          {processingPaymentId === payment.id ? 'Confirmando...' : 'Confirmar pagamento'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={processingPaymentId === payment.id}
                          className="p-btn p-btn--ghost"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-faint mb-2">
                  Este usuário não tem cobrança aberta no momento.
                </div>
              )}

              <div className="mt-2" style={{ paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="mb-1" style={{ fontWeight: 700 }}>Período gratuito (trial)</div>
                <div className="text-muted mb-1" style={{ fontSize: 13 }}>
                  {selectedUser.access?.status === 'trialing'
                    ? `Usuário em trial — ${selectedUser.access?.remainingDays ?? 0} dia(s) restante(s).`
                    : selectedUser.access?.status === 'expired' || (!selectedUser.access?.accessGranted && selectedUser.access?.plan === 'trial')
                      ? 'Trial expirado — o usuário perdeu o acesso.'
                      : `Status atual: ${selectedUser.access?.label || 'Sem status'}.`}
                </div>
                <div className="flex gap-1" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="p-field" style={{ margin: 0, flex: '0 0 auto' }}>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value) || 1)}
                      className="p-input"
                      style={{ width: 70, textAlign: 'center' }}
                    />
                  </label>
                  <span className="text-muted" style={{ fontSize: 13 }}>dias</span>
                  <button
                    type="button"
                    onClick={async () => {
                      setExtendingTrial(true)
                      setError('')
                      setSuccess('')
                      try {
                        await accessService.extendTrial(selectedUser.id, trialDays)
                        setSuccess(`Trial ${selectedUser.access?.status === 'trialing' ? 'estendido' : 'reativado'} em ${trialDays} dia(s).`)
                        await loadData()
                        setSelectedUserId(selectedUser.id)
                      } catch (err) {
                        setError(err.response?.data?.message || 'Não foi possível alterar o trial.')
                      } finally {
                        setExtendingTrial(false)
                      }
                    }}
                    disabled={extendingTrial}
                    className="p-btn p-btn--secondary"
                  >
                    {extendingTrial
                      ? 'Atualizando...'
                      : selectedUser.access?.status === 'trialing'
                        ? 'Estender trial'
                        : 'Reativar trial'}
                  </button>
                </div>
              </div>

              <div className="mt-2" style={{ paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="mb-1" style={{ fontWeight: 700 }}>Liberação manual de plano</div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleGrant('monthly')}
                    disabled={granting === 'monthly'}
                    className="p-btn p-btn--primary"
                  >
                    {granting === 'monthly' ? 'Liberando mensal...' : `Liberar mensal (${formatSubscriptionPrice(SUBSCRIPTION_PRICING.monthly)})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGrant('annual')}
                    disabled={granting === 'annual'}
                    className="p-btn p-btn--secondary"
                  >
                    {granting === 'annual' ? 'Liberando anual...' : `Liberar anual (${formatSubscriptionPrice(SUBSCRIPTION_PRICING.annual)})`}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="billing-card">
        <div className="p-panel-header__title font-serif mb-2">Lançamentos financeiros</div>
        {payments.length === 0 ? (
          <div className="text-muted">Ainda não há pagamentos registrados.</div>
        ) : (
          <div className="p-form-grid">
            {payments.slice().sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)).map((payment) => (
              <div key={payment.id} className="billing-card">
                <div className="flex justify-between gap-1 mb-1">
                  <strong>{payment.plan === 'annual' ? 'Anual' : payment.plan === 'monthly' ? 'Mensal' : 'Vitalício'} • {formatMethod(payment.method)}</strong>
                  <span className="text-accent">{formatSubscriptionPrice(payment.amount || 0)}</span>
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Usuário: {users.find((user) => user.id === payment.userId)?.email || payment.userId}<br />
                  Status: {formatStatus(payment.status)}<br />
                  Criado em: {formatDateTime(payment.createdAt)}<br />
                  Pago em: {formatDate(payment.paidAt)}<br />
                  Válido até: {formatDate(payment.validUntil)}<br />
                  Registrado por: {payment.recordedBy || 'checkout do cliente'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
