const net = require('net')
const tls = require('tls')
const { getEmailConfig, isEmailConfigured } = require('../config/email.config')

function encodeBase64(value = '') {
  return Buffer.from(String(value), 'utf8').toString('base64')
}

function formatAddress(name, email) {
  const sanitizedEmail = String(email || '').trim()
  const sanitizedName = String(name || '').replace(/"/g, "'").trim()
  return sanitizedName ? `"${sanitizedName}" <${sanitizedEmail}>` : sanitizedEmail
}

function normalizeLineBreaks(value = '') {
  return String(value).replace(/\r?\n/g, '\r\n')
}

function buildMessage({ fromName, fromEmail, to, subject, text, html }) {
  const boundary = `plumar-${Date.now().toString(16)}`
  const headers = [
    `From: ${formatAddress(fromName, fromEmail)}`,
    `To: ${formatAddress(to.name, to.email)}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
  ]

  if (html) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)

    return [
      ...headers,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      normalizeLineBreaks(text),
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      normalizeLineBreaks(html),
      `--${boundary}--`,
      '',
    ].join('\r\n')
  }

  headers.push('Content-Type: text/plain; charset="UTF-8"')
  headers.push('Content-Transfer-Encoding: 8bit')

  return [
    ...headers,
    '',
    normalizeLineBreaks(text),
    '',
  ].join('\r\n')
}

async function createConnection(config) {
  return new Promise((resolve, reject) => {
    const onError = (error) => reject(error)
    const socket = config.secure
      ? tls.connect({
        host: config.host,
        port: config.port,
        servername: config.host,
      }, () => resolve(socket))
      : net.createConnection({
        host: config.host,
        port: config.port,
      }, () => resolve(socket))

    socket.once('error', onError)
  })
}

function createSmtpChannel(socket) {
  let buffer = ''
  let queue = Promise.resolve()

  function readResponse(expectedCodes) {
    return new Promise((resolve, reject) => {
      const allowedCodes = Array.isArray(expectedCodes) ? expectedCodes.map(String) : [String(expectedCodes)]

      function onData(chunk) {
        buffer += chunk.toString('utf8')
        const lines = buffer.split('\r\n')
        buffer = lines.pop()

        while (lines.length) {
          const line = lines.shift()
          if (!line) continue

          const code = line.slice(0, 3)
          const isFinal = line[3] === ' '
          if (!isFinal) continue

          socket.off('error', onError)
          socket.off('data', onData)

          if (!allowedCodes.includes(code)) {
            reject(new Error(`SMTP respondeu ${line}`))
            return
          }

          resolve(line)
          return
        }
      }

      function onError(error) {
        socket.off('data', onData)
        reject(error)
      }

      socket.on('data', onData)
      socket.once('error', onError)
    })
  }

  function send(command, expectedCodes) {
    queue = queue.then(async () => {
      if (command !== null) {
        socket.write(command)
      }
      return readResponse(expectedCodes)
    })

    return queue
  }

  return {
    send,
  }
}

async function upgradeToTls(socket, config) {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({
      socket,
      host: config.host,
      servername: config.host,
    }, () => resolve(secureSocket))

    secureSocket.once('error', reject)
  })
}

function dotStuff(message) {
  return message
    .replace(/\r?\n/g, '\r\n')
    .replace(/^\./gm, '..')
}

async function sendViaSmtp(mail) {
  const config = getEmailConfig()
  const socket = await createConnection(config)
  let channel = createSmtpChannel(socket)

  try {
    await channel.send(null, 220)
    await channel.send(`EHLO ${config.host}\r\n`, 250)

    if (!config.secure && config.startTls) {
      await channel.send('STARTTLS\r\n', 220)
      const secureSocket = await upgradeToTls(socket, config)
      channel = createSmtpChannel(secureSocket)
      await channel.send(`EHLO ${config.host}\r\n`, 250)
    }

    if (config.user) {
      await channel.send('AUTH LOGIN\r\n', 334)
      await channel.send(`${encodeBase64(config.user)}\r\n`, 334)
      await channel.send(`${encodeBase64(config.pass)}\r\n`, 235)
    }

    await channel.send(`MAIL FROM:<${config.fromEmail}>\r\n`, 250)
    await channel.send(`RCPT TO:<${mail.to.email}>\r\n`, [250, 251])
    await channel.send('DATA\r\n', 354)

    const message = buildMessage({
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })

    await channel.send(`${dotStuff(message)}\r\n.\r\n`, 250)
    await channel.send('QUIT\r\n', 221)
  } finally {
    socket.end()
  }
}

function buildHtmlFromText(text = '') {
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br>')

  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1f2937">${escaped}</div>`
}

async function sendViaSupabaseFunction(mail) {
  const config = getEmailConfig()
  const endpoint = config.supabase.endpoint

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabase.anonKey,
      Authorization: `Bearer ${config.supabase.anonKey}`,
    },
    body: JSON.stringify({
      to: [mail.to.email],
      subject: mail.subject,
      html: mail.html || buildHtmlFromText(mail.text),
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Falha ao enviar e-mail via Supabase (${response.status}).`)
  }
}

async function sendEmail(mail) {
  if (!isEmailConfigured()) {
    return {
      delivered: false,
      skipped: true,
      reason: 'SMTP não configurado.',
      to: mail.to.email,
      subject: mail.subject,
    }
  }

  const config = getEmailConfig()

  if (config.provider === 'supabase_function') {
    await sendViaSupabaseFunction(mail)
  } else {
    await sendViaSmtp(mail)
  }

  return {
    delivered: true,
    to: mail.to.email,
    subject: mail.subject,
  }
}

module.exports = {
  sendEmail,
}
