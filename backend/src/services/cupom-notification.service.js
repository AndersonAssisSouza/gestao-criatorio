const { getEmailConfig } = require('../config/email.config')
const { sendEmail } = require('./email.service')

function brl(value) {
  const n = Number(value || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('pt-BR') } catch { return '—' }
}

// ─── EMAIL: nova indicação para o captador ─────────────────────────────────

function buildNewIndicacaoEmail({ cupom, indicacao, saldo }) {
  const subject = `🎉 Você ganhou ${brl(indicacao.comissaoCredito)} no PLUMAR!`
  const liberacaoData = formatDate(indicacao.liberadaEm)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333;line-height:1.55">
      <div style="background:linear-gradient(135deg,#C95025,#5A927F);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:26px">🎉 Nova indicação convertida!</h1>
        <p style="margin:10px 0 0;opacity:0.9">Seu cupom <strong>${cupom.codigo}</strong> foi usado</p>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #eee;border-top:none;border-radius:0 0 10px 10px">
        <p>Olá <strong>${cupom.captadorNome || 'Captador'}</strong>,</p>
        <p>Excelentes notícias! Um novo cliente usou seu cupom <strong style="font-family:monospace">${cupom.codigo}</strong> e você ganhou uma comissão.</p>

        <table style="width:100%;margin:20px 0;border-collapse:collapse">
          <tr><td style="padding:10px;background:#f8f8f8;border-radius:6px 0 0 6px"><strong>Plano contratado</strong></td>
              <td style="padding:10px;background:#f8f8f8;border-radius:0 6px 6px 0;text-align:right">${indicacao.plano === 'annual' ? 'Anual' : 'Mensal'}</td></tr>
          <tr><td style="padding:10px"><strong>Valor pago pelo cliente</strong></td>
              <td style="padding:10px;text-align:right">${brl(indicacao.valorLiquido)}</td></tr>
          <tr><td style="padding:10px;background:#E8F5E9;border-radius:6px 0 0 6px"><strong>💰 Sua comissão</strong></td>
              <td style="padding:10px;background:#E8F5E9;border-radius:0 6px 6px 0;text-align:right;font-size:18px;font-weight:700;color:#1B5E20">${brl(indicacao.comissaoCredito)}</td></tr>
          <tr><td style="padding:10px"><strong>Liberação do crédito</strong></td>
              <td style="padding:10px;text-align:right">${liberacaoData}</td></tr>
        </table>

        <div style="background:#FFF3E0;padding:15px;border-radius:8px;border-left:4px solid #F5A623">
          <strong style="color:#E65100">Seu saldo atualizado:</strong><br>
          <span style="font-size:22px;font-weight:700">${brl(saldo.saldoTotal)}</span>
          <span style="color:#666;font-size:13px"> (${brl(saldo.saldoSacavel)} já sacável)</span>
        </div>

        <div style="margin:25px 0;text-align:center">
          <a href="https://plumar.com.br" style="display:inline-block;background:#C95025;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:600">
            Ver meu painel
          </a>
        </div>

        <p style="color:#666;font-size:13px">
          <strong>Continue indicando!</strong> Quanto mais assinaturas seu cupom gerar,
          mais você ganha. Lembre-se do seu link:<br>
          <code style="background:#f4f4f4;padding:4px 8px;border-radius:4px">https://plumar.com.br/?cupom=${cupom.codigo}</code>
        </p>
      </div>
      <p style="text-align:center;color:#999;font-size:12px;margin-top:20px">
        Plumar · Gestão inteligente para criatórios · <a href="https://plumar.com.br">plumar.com.br</a>
      </p>
    </div>
  `

  const text = [
    `Parabéns! Nova indicação convertida no PLUMAR`,
    ``,
    `Cupom: ${cupom.codigo}`,
    `Plano: ${indicacao.plano === 'annual' ? 'Anual' : 'Mensal'}`,
    `Valor pago: ${brl(indicacao.valorLiquido)}`,
    `Sua comissão: ${brl(indicacao.comissaoCredito)}`,
    `Liberação: ${liberacaoData}`,
    ``,
    `Saldo total: ${brl(saldo.saldoTotal)}`,
    `Sacável: ${brl(saldo.saldoSacavel)}`,
    ``,
    `Seu link: https://plumar.com.br/?cupom=${cupom.codigo}`,
  ].join('\n')

  return { subject, html, text }
}

// ─── EMAIL: upgrade de tier ────────────────────────────────────────────────

function buildTierUpEmail({ cupom, tierAntigo, tierNovo, tierLabels }) {
  const subject = `🚀 Parabéns! Você subiu para ${tierLabels[tierNovo] || tierNovo} no PLUMAR`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333;line-height:1.55">
      <div style="background:linear-gradient(135deg,#F5A623,#C95025);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:28px">🚀 Tier promovido!</h1>
        <p style="margin:10px 0 0;opacity:0.95;font-size:18px">
          ${tierLabels[tierAntigo] || tierAntigo} → <strong>${tierLabels[tierNovo] || tierNovo}</strong>
        </p>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #eee;border-top:none;border-radius:0 0 10px 10px">
        <p>Olá <strong>${cupom.captadorNome || 'Captador'}</strong>,</p>
        <p>Seu desempenho como captador é excelente! Você foi promovido automaticamente para o tier <strong>${tierLabels[tierNovo] || tierNovo}</strong>.</p>

        <div style="background:#E8F5E9;padding:18px;border-radius:8px;margin:20px 0">
          <strong style="color:#1B5E20;display:block;margin-bottom:8px">A partir de agora você ganha mais:</strong>
          <ul style="margin:0;padding-left:20px">
            <li>Desconto do cliente: <strong>${cupom.descontoPercentual}%</strong></li>
            <li>Sua comissão: <strong>${cupom.comissaoPercentual}% recorrente por ${cupom.comissaoDuracaoMeses} meses</strong></li>
          </ul>
        </div>

        <p>As novas condições já valem para todas as próximas indicações.</p>

        <div style="margin:25px 0;text-align:center">
          <a href="https://plumar.com.br" style="display:inline-block;background:#C95025;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:600">
            Ver meu painel
          </a>
        </div>
      </div>
    </div>
  `

  const text = [
    `Parabéns! Você foi promovido para ${tierLabels[tierNovo] || tierNovo} no PLUMAR.`,
    ``,
    `Novas condições do cupom ${cupom.codigo}:`,
    `- Desconto cliente: ${cupom.descontoPercentual}%`,
    `- Sua comissão: ${cupom.comissaoPercentual}% por ${cupom.comissaoDuracaoMeses} meses`,
  ].join('\n')

  return { subject, html, text }
}

// ─── EMAIL: pedido de saque (para admin) ───────────────────────────────────

function buildPayoutRequestEmail({ cupom, valor, pixChave }) {
  const subject = `💸 PLUMAR: pedido de saque de ${brl(valor)} por ${cupom.captadorNome}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333;line-height:1.55">
      <div style="background:#C95025;color:#fff;padding:24px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="margin:0">💸 Novo pedido de saque</h1>
      </div>
      <div style="background:#fff;padding:25px;border:1px solid #eee;border-top:none;border-radius:0 0 10px 10px">
        <p><strong>${cupom.captadorNome}</strong> (cupom <code>${cupom.codigo}</code>) solicitou saque.</p>
        <table style="width:100%;margin:15px 0">
          <tr><td style="padding:8px;background:#f8f8f8"><strong>Valor</strong></td><td style="padding:8px;background:#f8f8f8;text-align:right;font-size:18px;font-weight:700">${brl(valor)}</td></tr>
          <tr><td style="padding:8px"><strong>Chave PIX</strong></td><td style="padding:8px;text-align:right;font-family:monospace">${pixChave || 'Não informada'}</td></tr>
          <tr><td style="padding:8px;background:#f8f8f8"><strong>E-mail</strong></td><td style="padding:8px;background:#f8f8f8;text-align:right">${cupom.captadorEmail}</td></tr>
        </table>
        <p>Efetue o PIX manualmente e registre o pagamento no Painel do Proprietário → Cupons & Indicações.</p>
      </div>
    </div>
  `
  const text = `Pedido de saque: ${brl(valor)} para ${cupom.captadorNome} — PIX: ${pixChave || 'não informada'}`
  return { subject, html, text }
}

// ─── Funções públicas ─────────────────────────────────────────────────────

async function notifyCaptadorIndicacao({ cupom, indicacao, saldo }) {
  if (!cupom?.captadorEmail) return null
  try {
    const mail = buildNewIndicacaoEmail({ cupom, indicacao, saldo })
    return await sendEmail({
      to: { name: cupom.captadorNome || 'Captador', email: cupom.captadorEmail },
      ...mail,
    })
  } catch (error) {
    console.error('[cupom-notify/indicacao]', error)
    return null
  }
}

async function notifyCaptadorTierUp({ cupom, tierAntigo, tierNovo, tierLabels }) {
  if (!cupom?.captadorEmail) return null
  try {
    const mail = buildTierUpEmail({ cupom, tierAntigo, tierNovo, tierLabels })
    return await sendEmail({
      to: { name: cupom.captadorNome || 'Captador', email: cupom.captadorEmail },
      ...mail,
    })
  } catch (error) {
    console.error('[cupom-notify/tierup]', error)
    return null
  }
}

async function notifyOwnerPayoutRequest({ cupom, valor, pixChave }) {
  try {
    const config = getEmailConfig()
    if (!config.masterEmail) return null
    const mail = buildPayoutRequestEmail({ cupom, valor, pixChave })
    return await sendEmail({
      to: { name: 'Administrador', email: config.masterEmail },
      ...mail,
    })
  } catch (error) {
    console.error('[cupom-notify/payout]', error)
    return null
  }
}

module.exports = {
  notifyCaptadorIndicacao,
  notifyCaptadorTierUp,
  notifyOwnerPayoutRequest,
}
