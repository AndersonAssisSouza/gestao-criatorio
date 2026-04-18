import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../../shared/StatCard'
import { cuponsService } from '../../../services/cupons.service'
import { KitDivulgacao } from './KitDivulgacao'

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

const TIER_BADGE = {
  bronze: { bg: '#EFEBE9', color: '#6D4C41', label: 'Bronze' },
  prata: { bg: '#ECEFF1', color: '#455A64', label: 'Prata' },
  ouro: { bg: '#FFF8E1', color: '#B8860B', label: 'Ouro' },
}

export function IndicacoesModule() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState('')
  const [solicitandoPayout, setSolicitandoPayout] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const r = await cuponsService.meuPrograma()
        setData(r)
      } catch (e) {
        setError(e.response?.data?.message || 'Erro ao carregar programa de indicações.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const programas = data?.programas || []
  const rules = data?.rules || {}

  const totalGeral = useMemo(() => {
    return programas.reduce((acc, p) => ({
      saldo: acc.saldo + (p.saldo?.saldoTotal || 0),
      sacavel: acc.sacavel + (p.saldo?.saldoSacavel || 0),
      indicacoes: acc.indicacoes + (p.indicacoes?.length || 0),
      pago: acc.pago + (p.saldo?.totalPago || 0),
    }), { saldo: 0, sacavel: 0, indicacoes: 0, pago: 0 })
  }, [programas])

  const solicitarSaque = async (cupom, saldoSacavel) => {
    const saqueMin = rules.saqueMinimo || 50
    if (saldoSacavel < saqueMin) {
      setError(`Saldo sacável (${brl(saldoSacavel)}) é menor que o mínimo de ${brl(saqueMin)}.`)
      return
    }
    if (!confirm(`Solicitar saque de ${brl(saldoSacavel)} via PIX?\nO pagamento será feito em até 72h.`)) return

    setSolicitandoPayout(cupom.id)
    setError('')
    setSuccess('')
    try {
      const r = await cuponsService.solicitarPayout(cupom.id, saldoSacavel)
      setSuccess(r.message || 'Pedido registrado.')
      // Recarrega dados
      const d = await cuponsService.meuPrograma()
      setData(d)
    } catch (e) {
      setError(e.response?.data?.message || 'Erro ao solicitar saque.')
    } finally {
      setSolicitandoPayout('')
    }
  }

  const copyLink = async (codigo) => {
    const link = `https://plumar.com.br/?cupom=${codigo}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(codigo)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(codigo)
      setTimeout(() => setCopied(''), 2000)
    }
  }

  if (loading) {
    return (
      <div className="module-hero">
        <div className="module-hero__eyebrow">Programa de Indicações</div>
        <h2 className="module-hero__title">Carregando seu painel...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="module-hero">
        <div className="module-hero__eyebrow">Programa de Indicações</div>
        <h2 className="module-hero__title">Erro</h2>
        <div className="module-hero__text">{error}</div>
      </div>
    )
  }

  if (!programas.length) {
    return (
      <div className="module-hero">
        <div className="module-hero__eyebrow">Programa de Indicações</div>
        <h2 className="module-hero__title">Você ainda não é um captador</h2>
        <div className="module-hero__text">
          Quer divulgar o PLUMAR e ganhar comissão recorrente a cada indicação que virar assinatura?
          Entre em contato com o proprietário pelo e-mail <strong>plumarapp@plumar.com.br</strong> para
          receber seu cupom personalizado.
        </div>
        <div style={{ marginTop: 20, padding: 16, background: 'var(--accent-ghost)', borderRadius: 12, fontSize: 13 }}>
          <strong>Como funciona:</strong>
          <ul style={{ marginTop: 8 }}>
            <li>Você recebe um código personalizado (ex: <code>SEUNOME15</code>)</li>
            <li>Clientes que usam seu cupom ganham desconto</li>
            <li>Você ganha comissão recorrente a cada mês ativo do cliente</li>
            <li>Saque via PIX a partir de {brl(rules.saqueMinimo || 50)}</li>
          </ul>
        </div>
      </div>
    )
  }

  const BTN_GHOST = { background: 'transparent', color: 'var(--text)', border: '1px solid var(--line-soft)', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }

  return (
    <div>
      <div className="module-hero">
        <div className="module-hero__eyebrow">Programa de Indicações • Captador</div>
        <h2 className="module-hero__title">Meu painel de indicações</h2>
        <div className="module-hero__text">
          Acompanhe suas comissões, extrato e divulgue seu link para ganhar mais.
          Saque via PIX a partir de <strong>{brl(rules.saqueMinimo || 50)}</strong>.
          Créditos liberam <strong>{rules.diasCarenciaCredito || 7} dias</strong> após a compra (conforme CDC).
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, margin: '12px 0', background: '#FDECEA', color: '#B71C1C', borderRadius: 8, fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, margin: '12px 0', background: '#E8F5E9', color: '#1B5E20', borderRadius: 8, fontSize: 13 }}>
          {success}
        </div>
      )}

      <div className="p-stats">
        <StatCard label="Saldo" value={brl(totalGeral.saldo)} desc="acumulado" color="#C95025" />
        <StatCard label="Sacável" value={brl(totalGeral.sacavel)} desc="disponível p/ PIX" color="#4CAF7D" />
        <StatCard label="Indicações" value={totalGeral.indicacoes} desc="convertidas" color="#5BC0EB" />
        <StatCard label="Recebido" value={brl(totalGeral.pago)} desc="total pago" color="#F5A623" />
      </div>

      {programas.map((p) => {
        const tier = TIER_BADGE[p.cupom.tier] || TIER_BADGE.bronze
        return (
          <section key={p.cupom.id} className="billing-card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ background: tier.bg, color: tier.color, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                    {tier.label}
                  </span>
                  <span style={{
                    background: p.cupom.status === 'ativo' ? '#E8F5E9' : '#FFF3E0',
                    color: p.cupom.status === 'ativo' ? '#1B5E20' : '#E65100',
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  }}>{p.cupom.status}</span>
                </div>
                <div style={{ fontSize: 26, fontFamily: "'DM Serif Display', serif", fontWeight: 700, fontFamily: 'monospace' }}>
                  {p.cupom.codigo}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {p.cupom.descontoPercentual}% OFF para o cliente • {p.cupom.comissaoPercentual}% de comissão recorrente
                  {p.cupom.comissaoDuracaoMeses ? ` por ${p.cupom.comissaoDuracaoMeses} meses` : ''}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saldo sacável</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#4CAF7D' }}>{brl(p.saldo?.saldoSacavel)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Total: {brl(p.saldo?.saldoTotal)}
                </div>
                {p.saldo?.saldoSacavel >= (rules.saqueMinimo || 50) && (
                  <button
                    type="button"
                    onClick={() => solicitarSaque(p.cupom, p.saldo.saldoSacavel)}
                    disabled={solicitandoPayout === p.cupom.id}
                    style={{
                      marginTop: 10, background: '#4CAF7D', color: '#fff',
                      border: 'none', padding: '8px 16px', borderRadius: 8,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {solicitandoPayout === p.cupom.id ? 'Enviando…' : `💸 Solicitar saque via PIX`}
                  </button>
                )}
                {p.saldo?.saldoSacavel < (rules.saqueMinimo || 50) && p.saldo?.saldoSacavel > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    Saque mínimo: {brl(rules.saqueMinimo || 50)}
                  </div>
                )}
              </div>
            </div>

            {/* Link para compartilhar */}
            <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-panel-solid)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Seu link de divulgação
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{
                  flex: 1, padding: '10px 12px', background: 'var(--bg)', borderRadius: 6,
                  fontSize: 13, overflow: 'auto', whiteSpace: 'nowrap',
                }}>
                  https://plumar.com.br/?cupom={p.cupom.codigo}
                </code>
                <button type="button" onClick={() => copyLink(p.cupom.codigo)} style={BTN_GHOST}>
                  {copied === p.cupom.codigo ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Kit de divulgação */}
            <KitDivulgacao cupom={p.cupom} />

            {/* Indicações */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Indicações ({p.indicacoes?.length || 0})
              </div>
              {!p.indicacoes?.length ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 14, background: 'var(--bg-panel-solid)', borderRadius: 8, textAlign: 'center' }}>
                  Ainda sem indicações convertidas. Divulgue seu link para começar!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line-soft)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6 }}>Data</th>
                      <th style={{ padding: 6 }}>Plano</th>
                      <th style={{ padding: 6 }}>Valor pago</th>
                      <th style={{ padding: 6 }}>Sua comissão</th>
                      <th style={{ padding: 6 }}>Liberado em</th>
                    </tr></thead>
                    <tbody>
                      {p.indicacoes.map((i) => (
                        <tr key={i.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                          <td style={{ padding: 6 }}>{formatDate(i.createdAt)}</td>
                          <td style={{ padding: 6 }}>{i.plano === 'annual' ? 'Anual' : 'Mensal'}</td>
                          <td style={{ padding: 6 }}>{brl(i.valorLiquido)}</td>
                          <td style={{ padding: 6, fontWeight: 700, color: '#4CAF7D' }}>{brl(i.comissaoCredito)}</td>
                          <td style={{ padding: 6 }}>{formatDate(i.liberadaEm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Extrato */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Extrato ({p.movimentos?.length || 0})
              </div>
              {!p.movimentos?.length ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 10 }}>Sem movimentos no extrato.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line-soft)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6 }}>Data</th>
                      <th style={{ padding: 6 }}>Tipo</th>
                      <th style={{ padding: 6 }}>Valor</th>
                      <th style={{ padding: 6 }}>Descrição</th>
                    </tr></thead>
                    <tbody>
                      {p.movimentos.slice(0, 20).map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                          <td style={{ padding: 6 }}>{formatDateTime(m.createdAt)}</td>
                          <td style={{ padding: 6, textTransform: 'capitalize' }}>
                            {m.tipo === 'credit' ? '💚 Crédito' : m.tipo === 'payout' ? '💸 Pagamento' : '⚙️ Ajuste'}
                          </td>
                          <td style={{ padding: 6, fontWeight: 700, color: Number(m.valor) < 0 ? '#B71C1C' : '#1B5E20' }}>
                            {brl(m.valor)}
                          </td>
                          <td style={{ padding: 6 }}>{m.descricao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )
      })}

      <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-panel-solid)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        <strong>Dicas para vender mais:</strong> poste conteúdo no Instagram/YouTube mostrando o simulador genético,
        compartilhe seu link nos grupos de criadores, indique para amigos criadores.
        Dúvidas sobre pagamento? Fale com o proprietário do sistema.
      </div>
    </div>
  )
}
