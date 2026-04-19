// Testes de redação do logger (LOW-02)
const test = require('node:test')
const assert = require('node:assert/strict')
const { redactObject, redactValue } = require('../logger.utils')

test('redactObject oculta campos sensíveis', () => {
  const input = {
    email: 'test@plumar.com',
    password: 'Senha@1234',
    passwordHash: '$2a$12$AAAA',
    authorization: 'Bearer xxx',
    name: 'Fulano',
  }
  const out = redactObject(input)
  assert.equal(out.password, '[REDACTED]')
  assert.equal(out.passwordHash, '[REDACTED]')
  assert.equal(out.authorization, '[REDACTED]')
  // email é parcialmente redatado
  assert.match(out.email, /^te\*\*\*@plumar\.com$/)
  // name passa sem alteração (não é sensível)
  assert.equal(out.name, 'Fulano')
})

test('redactObject trata Error', () => {
  const err = new Error('falha')
  const out = redactObject(err)
  assert.equal(out.name, 'Error')
  assert.equal(out.message, 'falha')
  assert.ok(out.stack)
})

test('redactObject recursivo em nested', () => {
  const input = {
    outer: { password: 'x', name: 'ok' },
  }
  const out = redactObject(input)
  assert.equal(out.outer.password, '[REDACTED]')
  assert.equal(out.outer.name, 'ok')
})

test('redactValue parcializa tokens longos', () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.signaturepart_long'
  const out = redactValue(token)
  assert.match(out, /^eyJhbG\.\.\.\[\d+ch\]$/)
})

test('redactValue mantém strings curtas', () => {
  assert.equal(redactValue('abc'), 'abc')
  assert.equal(redactValue('short'), 'short')
})

test('redactObject trata arrays', () => {
  const out = redactObject([{ password: 'x' }, { ok: 1 }])
  assert.equal(out[0].password, '[REDACTED]')
  assert.equal(out[1].ok, 1)
})
