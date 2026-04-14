const crypto = require('crypto')

function normalizePaymentMethod(method = '') {
  const normalized = String(method || '').trim().toLowerCase()
  return ['pix', 'card'].includes(normalized) ? normalized : ''
}

function detectCardBrand(cardNumber = '') {
  const digits = String(cardNumber).replace(/\D/g, '')

  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(digits)) return 'Elo'
  if (/^(6062|3841)/.test(digits)) return 'Hipercard'
  return 'Cartao'
}

function isValidLuhn(cardNumber = '') {
  const digits = String(cardNumber).replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let shouldDouble = false

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

function validateCardCheckout(payload = {}) {
  const holderName = String(payload.cardHolderName || '').trim()
  const cardNumber = String(payload.cardNumber || '').replace(/\D/g, '')
  const expiryMonth = String(payload.expiryMonth || '').replace(/\D/g, '')
  const expiryYear = String(payload.expiryYear || '').replace(/\D/g, '')
  const cvc = String(payload.cvc || '').replace(/\D/g, '')

  if (holderName.length < 5) {
    return { valid: false, message: 'Informe o nome impresso no cartão.' }
  }

  if (!isValidLuhn(cardNumber)) {
    return { valid: false, message: 'Número do cartão inválido.' }
  }

  const month = Number(expiryMonth)
  const year = Number(expiryYear.length === 2 ? `20${expiryYear}` : expiryYear)
  if (!month || month < 1 || month > 12 || !year || year < 2024) {
    return { valid: false, message: 'Validade do cartão inválida.' }
  }

  const expiration = new Date(year, month, 0, 23, 59, 59, 999)
  if (Number.isNaN(expiration.getTime()) || expiration.getTime() < Date.now()) {
    return { valid: false, message: 'O cartão informado está vencido.' }
  }

  if (!/^\d{3,4}$/.test(cvc)) {
    return { valid: false, message: 'Código de segurança inválido.' }
  }

  return {
    valid: true,
    card: {
      cardHolderName: holderName,
      cardLast4: cardNumber.slice(-4),
      cardBrand: detectCardBrand(cardNumber),
      cardMasked: `•••• •••• •••• ${cardNumber.slice(-4)}`,
      expiryMonth: expiryMonth.padStart(2, '0'),
      expiryYear: String(year),
    },
  }
}

function createPaymentReference(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

function createPixPayload({ user, plan, amount }) {
  const txid = createPaymentReference('PIX')
  const pixCode = [
    'PLUMAR',
    'PIX',
    txid,
    String(user.id || '').slice(0, 8),
    String(plan || '').toUpperCase(),
    String(amount).replace('.', ','),
  ].join('|')

  return {
    paymentReference: txid,
    pixCode,
    pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    qrCodeText: pixCode,
  }
}

module.exports = {
  createPixPayload,
  normalizePaymentMethod,
  validateCardCheckout,
}
