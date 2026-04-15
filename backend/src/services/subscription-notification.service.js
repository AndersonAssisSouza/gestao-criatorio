const { getEmailConfig } = require('../config/email.config')
const { sendEmail } = require('./email.service')

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDateTime(value) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleString('pt-BR')
}

function formatDate(value) {
  if (!value) return 'Sem vencimento'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatPlan(plan) {
  if (plan === 'annual') return 'Plano anual'
  if (plan === 'monthly') return 'Plano mensal'
  if (plan === 'lifetime') return 'Acesso vitalício'
  return 'Plano contratado'
}

function formatMethod(method) {
  if (method === 'pix') return 'PIX'
  if (method === 'card') return 'Cartão de crédito'
  return 'Liberação manual'
}

function buildReleaseContext({ user, payment, access, approvedBy }) {
  return {
    customerName: user.name,
    customerEmail: user.email,
    planLabel: formatPlan(payment.plan),
    paymentMethodLabel: formatMethod(payment.method),
    amountLabel: formatCurrency(payment.amount),
    paidAtLabel: formatDateTime(payment.paidAt),
    validUntilLabel: formatDate(payment.validUntil || access.expiresAt),
    referenceLabel: payment.paymentReference || payment.id,
    approvedBy: approvedBy || 'Plumar',
  }
}

function buildCustomerEmail(context) {
  const subject = `Plumar • ${context.planLabel} liberado`
  const text = [
    `Olá, ${context.customerName}.`,
    '',
    'O seu pagamento foi confirmado e o acesso ao sistema foi liberado.',
    '',
    `Plano: ${context.planLabel}`,
    `Forma de pagamento: ${context.paymentMethodLabel}`,
    `Valor: ${context.amountLabel}`,
    `Pagamento confirmado em: ${context.paidAtLabel}`,
    `Acesso válido até: ${context.validUntilLabel}`,
    `Referência: ${context.referenceLabel}`,
    '',
    'Você já pode entrar normalmente no sistema com o seu e-mail de cadastro.',
  ].join('\n')

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.7">
      <h2 style="margin-bottom:8px">Pagamento confirmado</h2>
      <p>Olá, <strong>${context.customerName}</strong>.</p>
      <p>O seu pagamento foi confirmado e o acesso ao sistema foi liberado.</p>
      <p><strong>Plano:</strong> ${context.planLabel}<br />
      <strong>Forma de pagamento:</strong> ${context.paymentMethodLabel}<br />
      <strong>Valor:</strong> ${context.amountLabel}<br />
      <strong>Pagamento confirmado em:</strong> ${context.paidAtLabel}<br />
      <strong>Acesso válido até:</strong> ${context.validUntilLabel}<br />
      <strong>Referência:</strong> ${context.referenceLabel}</p>
      <p>Você já pode entrar normalmente no sistema com o seu e-mail de cadastro.</p>
    </div>
  `

  return { subject, text, html }
}

function buildMasterEmail(context) {
  const subject = `Plumar • liberação confirmada para ${context.customerEmail}`
  const text = [
    'A contratação foi liberada com sucesso.',
    '',
    `Cliente: ${context.customerName}`,
    `E-mail: ${context.customerEmail}`,
    `Plano: ${context.planLabel}`,
    `Forma de pagamento: ${context.paymentMethodLabel}`,
    `Valor: ${context.amountLabel}`,
    `Pagamento confirmado em: ${context.paidAtLabel}`,
    `Acesso válido até: ${context.validUntilLabel}`,
    `Referência: ${context.referenceLabel}`,
    `Liberação confirmada por: ${context.approvedBy}`,
  ].join('\n')

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.7">
      <h2 style="margin-bottom:8px">Liberação confirmada</h2>
      <p>A contratação foi liberada com sucesso.</p>
      <p><strong>Cliente:</strong> ${context.customerName}<br />
      <strong>E-mail:</strong> ${context.customerEmail}<br />
      <strong>Plano:</strong> ${context.planLabel}<br />
      <strong>Forma de pagamento:</strong> ${context.paymentMethodLabel}<br />
      <strong>Valor:</strong> ${context.amountLabel}<br />
      <strong>Pagamento confirmado em:</strong> ${context.paidAtLabel}<br />
      <strong>Acesso válido até:</strong> ${context.validUntilLabel}<br />
      <strong>Referência:</strong> ${context.referenceLabel}<br />
      <strong>Liberação confirmada por:</strong> ${context.approvedBy}</p>
    </div>
  `

  return { subject, text, html }
}

function buildReminderContext({ user, reminderType, daysBefore, expiresAt, access }) {
  return {
    customerName: user.name,
    customerEmail: user.email,
    reminderType,
    daysBefore,
    expiresAtLabel: formatDate(expiresAt || access?.expiresAt),
    planLabel: reminderType === 'trial' ? 'Período gratuito' : formatPlan(user.subscriptionPlan || access?.plan),
  }
}

function buildReminderEmail(context) {
  const reminderLabel = context.reminderType === 'trial'
    ? 'seu período gratuito'
    : 'sua assinatura'

  const subject = context.reminderType === 'trial'
    ? `Plumar • seu teste grátis vence em ${context.daysBefore} dia`
    : `Plumar • sua assinatura vence em ${context.daysBefore} dia${context.daysBefore > 1 ? 's' : ''}`

  const text = [
    `Olá, ${context.customerName}.`,
    '',
    `Este é um lembrete de que ${reminderLabel} vence em ${context.daysBefore} dia${context.daysBefore > 1 ? 's' : ''}.`,
    '',
    `Plano: ${context.planLabel}`,
    `Vencimento: ${context.expiresAtLabel}`,
    '',
    context.reminderType === 'trial'
      ? 'Para continuar usando o sistema sem interrupção, escolha um plano mensal ou anual antes do vencimento.'
      : 'Se você ainda não renovou, faça a renovação antes do vencimento para não perder o acesso ao sistema.',
  ].join('\n')

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.7">
      <h2 style="margin-bottom:8px">Lembrete de vencimento</h2>
      <p>Olá, <strong>${context.customerName}</strong>.</p>
      <p>Este é um lembrete de que ${reminderLabel} vence em <strong>${context.daysBefore} dia${context.daysBefore > 1 ? 's' : ''}</strong>.</p>
      <p><strong>Plano:</strong> ${context.planLabel}<br />
      <strong>Vencimento:</strong> ${context.expiresAtLabel}</p>
      <p>${context.reminderType === 'trial'
        ? 'Para continuar usando o sistema sem interrupção, escolha um plano mensal ou anual antes do vencimento.'
        : 'Se você ainda não renovou, faça a renovação antes do vencimento para não perder o acesso ao sistema.'}</p>
    </div>
  `

  return { subject, text, html }
}

async function notifyContractRelease({ user, payment, access, approvedBy }) {
  const config = getEmailConfig()
  const context = buildReleaseContext({ user, payment, access, approvedBy })
  const deliveries = []

  const customerMail = buildCustomerEmail(context)
  deliveries.push(await sendEmail({
    to: { name: user.name, email: user.email },
    ...customerMail,
  }))

  if (config.masterEmail && config.masterEmail !== user.email) {
    const masterMail = buildMasterEmail(context)
    deliveries.push(await sendEmail({
      to: { name: 'Conta mestre', email: config.masterEmail },
      ...masterMail,
    }))
  } else if (config.masterEmail) {
    const masterMail = buildMasterEmail(context)
    deliveries.push(await sendEmail({
      to: { name: 'Conta mestre', email: config.masterEmail },
      ...masterMail,
    }))
  }

  return deliveries
}

async function notifyUpcomingExpiration({ user, reminderType, daysBefore, expiresAt, access }) {
  const context = buildReminderContext({ user, reminderType, daysBefore, expiresAt, access })
  const mail = buildReminderEmail(context)

  return sendEmail({
    to: { name: user.name, email: user.email },
    ...mail,
  })
}

// ─── Cancelamento ─────────────────────────────────────────────────────────────

function buildCancellationCustomerEmail({ user, accessEnd, withinWithdrawalPeriod, reason }) {
  const subject = 'Plumar • Cancelamento de assinatura confirmado'
  const accessLabel = formatDate(accessEnd)
  const withdrawalNote = withinWithdrawalPeriod
    ? '<p style="padding:12px;background:#fff3e0;border-radius:6px;border-left:3px solid #f57c00"><strong>Direito de arrependimento:</strong> Você está dentro do prazo legal de 7 dias para solicitar reembolso integral. Responda este e-mail caso deseje exercer esse direito.</p>'
    : ''
  const withdrawalText = withinWithdrawalPeriod
    ? '\nDIREITO DE ARREPENDIMENTO: Você está dentro do prazo legal de 7 dias. Responda este e-mail para solicitar reembolso integral.'
    : ''

  const text = [
    `Olá, ${user.name}.`,
    '',
    'Confirmamos o cancelamento da sua assinatura no sistema Plumar.',
    '',
    `Seu acesso permanece ativo até: ${accessLabel}`,
    'Após essa data, o acesso aos módulos será encerrado.',
    '',
    'O que você precisa saber:',
    '• Você pode continuar usando o sistema normalmente até a data acima.',
    '• Seus dados ficam preservados por 90 dias após o encerramento.',
    '• Você pode reativar sua assinatura a qualquer momento.',
    withdrawalText,
    reason ? `\nMotivo informado: ${reason}` : '',
    '',
    'Lamentamos sua saída e esperamos vê-lo novamente em breve.',
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.7">
      <h2 style="margin-bottom:8px;color:#C95025">Cancelamento confirmado</h2>
      <p>Olá, <strong>${user.name}</strong>.</p>
      <p>Confirmamos o cancelamento da sua assinatura no sistema Plumar.</p>
      <div style="padding:16px;background:#f7f5f0;border-radius:8px;margin:16px 0">
        <p style="margin:0"><strong>Acesso ativo até:</strong> ${accessLabel}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#666">Após essa data, o acesso aos módulos será encerrado.</p>
      </div>
      ${withdrawalNote}
      <p><strong>O que você precisa saber:</strong></p>
      <ul style="padding-left:20px">
        <li>Você pode continuar usando o sistema normalmente até a data acima.</li>
        <li>Seus dados ficam preservados por 90 dias após o encerramento.</li>
        <li>Você pode reativar sua assinatura a qualquer momento.</li>
      </ul>
      ${reason ? `<p style="font-size:13px;color:#666"><em>Motivo informado: ${reason}</em></p>` : ''}
      <p>Lamentamos sua saída e esperamos vê-lo novamente em breve.</p>
    </div>
  `

  return { subject, text, html }
}

function buildCancellationMasterEmail({ user, accessEnd, withinWithdrawalPeriod, reason }) {
  const subject = `Plumar • Cancelamento solicitado por ${user.email}`
  const accessLabel = formatDate(accessEnd)

  const text = [
    'Um assinante solicitou cancelamento.',
    '',
    `Cliente: ${user.name}`,
    `E-mail: ${user.email}`,
    `Plano: ${formatPlan(user.subscriptionPlan)}`,
    `Acesso ativo até: ${accessLabel}`,
    `Dentro do prazo de arrependimento: ${withinWithdrawalPeriod ? 'Sim (7 dias)' : 'Não'}`,
    reason ? `Motivo: ${reason}` : '',
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.7">
      <h2 style="margin-bottom:8px;color:#C95025">Cancelamento de assinatura</h2>
      <p>Um assinante solicitou o cancelamento.</p>
      <p><strong>Cliente:</strong> ${user.name}<br />
      <strong>E-mail:</strong> ${user.email}<br />
      <strong>Plano:</strong> ${formatPlan(user.subscriptionPlan)}<br />
      <strong>Acesso ativo até:</strong> ${accessLabel}<br />
      <strong>Prazo de arrependimento:</strong> ${withinWithdrawalPeriod ? '<span style="color:#f57c00">Sim (7 dias)</span>' : 'Não'}</p>
      ${reason ? `<p><strong>Motivo:</strong> <em>${reason}</em></p>` : ''}
    </div>
  `

  return { subject, text, html }
}

async function notifyCancellation({ user, accessEnd, withinWithdrawalPeriod, reason }) {
  const config = getEmailConfig()
  const deliveries = []

  // Email ao cliente
  const customerMail = buildCancellationCustomerEmail({ user, accessEnd, withinWithdrawalPeriod, reason })
  deliveries.push(await sendEmail({
    to: { name: user.name, email: user.email },
    ...customerMail,
  }))

  // Email ao administrador
  if (config.masterEmail) {
    const masterMail = buildCancellationMasterEmail({ user, accessEnd, withinWithdrawalPeriod, reason })
    deliveries.push(await sendEmail({
      to: { name: 'Administrador', email: config.masterEmail },
      ...masterMail,
    }))
  }

  return deliveries
}

module.exports = {
  notifyContractRelease,
  notifyUpcomingExpiration,
  notifyCancellation,
}
