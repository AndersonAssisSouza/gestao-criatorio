// Smoke test do audit service — garante que secrets vazados em payload são redatados.
const test = require('node:test')
const assert = require('node:assert/strict')
const audit = require('../../services/audit.service')

test('audit.log redata campos sensíveis no payload', () => {
  const logs = []
  const origLog = console.log
  console.log = (...args) => logs.push(args.join(' '))
  try {
    audit.log('auth.login.fail', { headers: { 'user-agent': 'test' }, ip: '1.2.3.4' }, {
      email: 'foo@bar.com',
      password: 'Secret@1234',
      authorization: 'Bearer xxx',
    })
  } finally {
    console.log = origLog
  }
  const out = logs.join('\n')
  assert.ok(out.includes('[AUDIT]'))
  assert.ok(out.includes('"event":"auth.login.fail"'))
  assert.ok(!out.includes('Secret@1234'))
  assert.ok(!out.includes('Bearer xxx'))
  assert.ok(out.includes('[REDACTED]'))
})

test('audit.log extrai IP de cf-connecting-ip', () => {
  const logs = []
  const origLog = console.log
  console.log = (...args) => logs.push(args.join(' '))
  try {
    audit.log('auth.login.success', { headers: { 'cf-connecting-ip': '9.9.9.9' } }, { userId: 'u1' })
  } finally {
    console.log = origLog
  }
  assert.ok(logs.join('').includes('9.9.9.9'))
})
