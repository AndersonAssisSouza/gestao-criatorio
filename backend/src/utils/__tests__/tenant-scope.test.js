// Testes unitários do helper de tenant scoping (CRIT-01).
// Execute com: node --test src/utils/__tests__/tenant-scope.test.js

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  stampCriatorio,
  itemBelongsTo,
  filterByScope,
} = require('../tenant-scope.utils')

const crA = { id: 'crA', NomeCriatorio: 'Criatório A' }
const crB = { id: 'crB', NomeCriatorio: 'Criatório B' }
const userA = { userId: 'uA', role: 'user' }
const userB = { userId: 'uB', role: 'user' }
const owner = { userId: 'uOwner', role: 'owner' }

test('stampCriatorio aplica criatorioId + userId', () => {
  const stamped = stampCriatorio({ name: 'x' }, crA, userA)
  assert.equal(stamped.criatorioId, 'crA')
  assert.equal(stamped.userId, 'uA')
  assert.equal(stamped.name, 'x')
})

test('itemBelongsTo retorna true quando criatorioId bate', () => {
  const item = { id: 1, criatorioId: 'crA' }
  assert.equal(itemBelongsTo(item, crA, userA), true)
  assert.equal(itemBelongsTo(item, crB, userB), false)
})

test('itemBelongsTo retorna true quando userId bate (fallback)', () => {
  const item = { id: 1, userId: 'uA' }
  assert.equal(itemBelongsTo(item, crA, userA), true)
  assert.equal(itemBelongsTo(item, crB, userB), false)
})

test('itens legados (sem criatorioId e userId) só owner acessa', () => {
  const legacy = { id: 1, name: 'sem escopo' }
  assert.equal(itemBelongsTo(legacy, crA, userA), false)
  assert.equal(itemBelongsTo(legacy, crA, owner), true)
})

test('filterByScope filtra corretamente por criatório', () => {
  const items = [
    { id: 1, criatorioId: 'crA' },
    { id: 2, criatorioId: 'crB' },
    { id: 3, criatorioId: 'crA' },
  ]
  const scoped = filterByScope(items, crA, userA)
  assert.equal(scoped.length, 2)
  assert.deepEqual(scoped.map((i) => i.id), [1, 3])
})

test('filterByScope: owner vê tudo', () => {
  const items = [
    { id: 1, criatorioId: 'crA' },
    { id: 2, criatorioId: 'crB' },
  ]
  const scoped = filterByScope(items, crA, owner)
  assert.equal(scoped.length, 2)
})

test('filterByScope: usuário comum NÃO vê itens de outros tenants (IDOR bloqueado)', () => {
  const items = [
    { id: 1, criatorioId: 'crA' },
    { id: 2, criatorioId: 'crB', sensitive: 'dados-privados-B' },
  ]
  const scoped = filterByScope(items, crA, userA)
  assert.equal(scoped.length, 1)
  assert.equal(scoped[0].id, 1)
  assert.equal(scoped.some((i) => i.sensitive), false)
})

test('filterByScope aceita array vazio', () => {
  assert.deepEqual(filterByScope([], crA, userA), [])
})

test('filterByScope aceita não-array', () => {
  assert.deepEqual(filterByScope(null, crA, userA), [])
  assert.deepEqual(filterByScope(undefined, crA, userA), [])
})
