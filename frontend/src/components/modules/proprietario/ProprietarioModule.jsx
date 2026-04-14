import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../../shared/StatCard'
import { accessService } from '../../../services/access.service'
import { SUBSCRIPTION_PRICING, formatSubscriptionPrice } from '../../../config/subscription'

const CARD_STYLE = {
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.03)',
  boxShadow: 'var(--shadow-md)',
}

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
    return <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Carregando controle do proprietário...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
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

      {error && <div style={{ ...CARD_STYLE, padding: 16, color: '#ffb9aa', borderColor: 'rgba(224,92,75,0.24)' }}>{error}</div>}
      {success && <div style={{ ...CARD_STYLE, padding: 16, color: '#b6f1cf', borderColor: 'rgba(76,175,125,0.24)' }}>{success}</div>}

      <div className="stat-grid">
        <StatCard label="Clientes" value={stats.total} desc="usuarios cadastrados" color="#C95025" />
        <StatCard label="Ativos" value={stats.ativos} desc="acesso liberado" color="#4CAF7D" />
        <StatCard label="Cobranças" value={stats.pendentes} desc="pendentes de conferência" color="#F5A623" />
        <StatCard label="Trial" value={stats.trial} desc="7 dias gratuitos" color="#5BC0EB" />
      </div>

      <div className="billing-studio">
        <section className="module-panel" style={{ ...CARD_STYLE, padding: 22 }}>
          <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", marginBottom: 16 }}>Base de assinantes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.filter((user) => user.role !== 'owner').map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                style={{
                  ...CARD_STYLE,
                  padding: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: selectedUserId === user.id ? 'rgba(201,80,37,0.24)' : 'rgba(255,255,255,0.06)',
                  background: selectedUserId === user.id ? 'rgba(201,80,37,0.08)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <strong>{user.name}</strong>
                  <span style={{ color: user.access?.accessGranted ? '#8fe0b1' : '#f3b08e' }}>{user.access?.label || 'Sem status'}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.email}</div>
                <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 6 }}>
                  Plano {user.access?.plan || 'trial'} • expira em {formatDate(user.access?.expiresAt)}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="module-panel" style={{ ...CARD_STYLE, padding: 22 }}>
          <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>Aprovação financeira</div>
          {!selectedUser ? (
            <div style={{ color: 'var(--text-muted)' }}>Nenhum assinante disponível ainda.</div>
          ) : (
            <>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
                <strong style={{ color: 'var(--text-main)' }}>{selectedUser.name}</strong><br />
                {selectedUser.email}<br />
                Status atual: {selectedUser.access?.label || 'Sem status'}<br />
                Solicitação aberta: {selectedUser.subscriptionRequestedPlan || 'nenhuma'}
              </div>

              {pendingPayments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} style={{ ...CARD_STYLE, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <strong>{payment.plan === 'annual' ? 'Plano anual' : 'Plano mensal'} • {formatMethod(payment.method)}</strong>
                        <span style={{ color: 'var(--accent-light)' }}>{formatSubscriptionPrice(payment.amount)}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8, marginBottom: 12 }}>
                        Status: {formatStatus(payment.status)}<br />
                        Referência: {payment.paymentReference || payment.id}<br />
                        Criado em: {formatDateTime(payment.createdAt)}
                        {payment.cardMasked ? <><br />Cartão: {payment.cardBrand} {payment.cardMasked}</> : null}
                        {payment.pixCode ? <><br />PIX: {payment.pixCode}</> : null}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={processingPaymentId === payment.id}
                          className="theme-action-btn"
                        >
                          {processingPaymentId === payment.id ? 'Confirmando...' : 'Confirmar pagamento'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={processingPaymentId === payment.id}
                          className="theme-action-btn theme-action-btn--ghost"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-faint)', lineHeight: 1.8, marginBottom: 18 }}>
                  Este usuário não tem cobrança aberta no momento.
                </div>
              )}

              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: 'var(--text-soft)', fontWeight: 700, marginBottom: 12 }}>Liberação manual</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleGrant('monthly')}
                    disabled={granting === 'monthly'}
                    style={{ border: 'none', borderRadius: 14, padding: '13px 14px', background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))', color: 'var(--accent-contrast)', cursor: 'pointer' }}
                  >
                    {granting === 'monthly' ? 'Liberando mensal...' : `Liberar mensal (${formatSubscriptionPrice(SUBSCRIPTION_PRICING.monthly)})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGrant('annual')}
                    disabled={granting === 'annual'}
                    style={{ border: '1px solid rgba(76,175,125,0.28)', borderRadius: 14, padding: '13px 14px', background: 'rgba(76,175,125,0.12)', color: '#d6f5e6', cursor: 'pointer' }}
                  >
                    {granting === 'annual' ? 'Liberando anual...' : `Liberar anual (${formatSubscriptionPrice(SUBSCRIPTION_PRICING.annual)})`}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="module-panel" style={{ ...CARD_STYLE, padding: 22 }}>
        <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", marginBottom: 14 }}>Lançamentos financeiros</div>
        {payments.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>Ainda não há pagamentos registrados.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {payments.slice().sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)).map((payment) => (
              <div key={payment.id} style={{ ...CARD_STYLE, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <strong>{payment.plan === 'annual' ? 'Anual' : payment.plan === 'monthly' ? 'Mensal' : 'Vitalício'} • {formatMethod(payment.method)}</strong>
                  <span style={{ color: 'var(--accent-light)' }}>{formatSubscriptionPrice(payment.amount || 0)}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>
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

      <section className="module-panel" style={{ ...CARD_STYLE, padding: 22 }}>
        <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', serif", marginBottom: 10 }}>Cadastros vindos do Power Apps</div>
        <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
          Esta importação puxa diretamente as listas reais do seu SharePoint e grava uma cópia local no sistema para uso diário sem depender da conexão externa.
          Além do criatório e do plantel, ela também traz anéis, gaiolas, ovos, filhotes, espécies, financeiro, mutações e itens auxiliares.
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleImportSharePoint}
            disabled={importingSharePoint}
            style={{ border: 'none', borderRadius: 14, padding: '13px 16px', background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))', color: 'var(--accent-contrast)', cursor: importingSharePoint ? 'not-allowed' : 'pointer', opacity: importingSharePoint ? 0.7 : 1 }}
          >
            {importingSharePoint ? 'Importando listas...' : 'Importar todas as listas do SharePoint'}
          </button>
        </div>
      </section>
    </div>
  )
}
