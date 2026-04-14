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

module.exports = {
  notifyContractRelease,
  notifyUpcomingExpiration,
}
