// Testes do html-escape (HIGH-04)
const test = require('node:test')
const assert = require('node:assert/strict')
const { escapeHtml, escapeHtmlAttr } = require('../html-escape.utils')

test('escapeHtml neutraliza < > & " \'', () => {
  const payload = `<script>alert('x')</script> & "danger"`
  const safe = escapeHtml(payload)
  assert.equal(safe.includes('<script>'), false)
  assert.equal(safe.includes('&lt;script&gt;'), true)
  assert.equal(safe.includes('&amp;'), true)
  assert.equal(safe.includes('&quot;'), true)
  assert.equal(safe.includes('&#x27;'), true)
})

test('escapeHtml trata null/undefined como string vazia', () => {
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(undefined), '')
  assert.equal(escapeHtml(''), '')
})

test('escapeHtmlAttr também escapa ` e =', () => {
  const s = escapeHtmlAttr('"x=y`z')
  assert.equal(s.includes('&quot;'), true)
  assert.equal(s.includes('&#61;'), true)
  assert.equal(s.includes('&#96;'), true)
})

test('escapeHtml não quebra strings comuns', () => {
  assert.equal(escapeHtml('Fulano da Silva'), 'Fulano da Silva')
  assert.equal(escapeHtml('test@example.com'), 'test@example.com')
})
