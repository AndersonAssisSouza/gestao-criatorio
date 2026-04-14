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
  const [importingSharePoint, setImportingSharePoint] = useState(false)

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

  const handleImportSharePoint = async () => {
    setImportingSharePoint(true)
    setError('')
    setSuccess('')

    try {
      const response = await accessService.importMySharePointData()
      setSuccess(
        `Importação concluída: ${response.importedCounts?.criatorios || 0} criatório, ${response.importedCounts?.plantel || 0} aves, ${response.importedCounts?.aneis || 0} anéis, ${response.importedCounts?.gaiolas || 0} gaiolas, ${response.importedCounts?.ovos || 0} ovos, ${response.importedCounts?.filhotes || 0} filhotes, ${response.importedCounts?.especies || 0} espécies, ${response.importedCounts?.financeiro || 0} lançamentos financeiros, ${response.importedCounts?.mutacoes || 0} mutações e ${response.importedCounts?.listaItens || 0} itens auxiliares trazidos do SharePoint.`
      )
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível importar os dados do SharePoint.')
    } finally {
      setImportingSharePoint(false)
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
              >
                <div className="flex justify-between gap-1 mb-1">
                  <strong>{user.name}</strong>
                  <span className={user.access?.accessGranted ? 'text-success' : 'text-danger'}>{user.access?.label || 'Sem status'}</span>
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>{user.email}</div>
                <div className="text-faint mt-1" style={{ fontSize: 12 }}>
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
                <div className="mb-1" style={{ fontWeight: 700 }}>Liberação manual</div>
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

      <section className="billing-card">
        <div className="p-panel-header__title font-serif mb-1">Cadastros vindos do Power Apps</div>
        <div className="text-muted">
          Esta importação puxa diretamente as listas reais do seu SharePoint e grava uma cópia local no sistema para uso diário sem depender da conexão externa.
          Além do criatório e do plantel, ela também traz anéis, gaiolas, ovos, filhotes, espécies, financeiro, mutações e itens auxiliares.
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={handleImportSharePoint}
            disabled={importingSharePoint}
            className="p-btn p-btn--primary"
          >
            {importingSharePoint ? 'Importando listas...' : 'Importar todas as listas do SharePoint'}
          </button>
        </div>
      </section>
    </div>
  )
}
