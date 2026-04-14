const crypto = require('crypto')
const path = require('path')
const storageEngine = require('./storage.engine')

const STORAGE_FILE = path.join(storageEngine.DEFAULT_STORAGE_DIR, 'payments.json')

async function readPayments() {
  const payments = await storageEngine.readCollection('payments', STORAGE_FILE)
  return Array.isArray(payments) ? payments : []
}

async function writePayments(payments) {
  await storageEngine.writeCollection('payments', payments, STORAGE_FILE)
}

async function createPayment(payload) {
  return queueWrite(async () => {
    const payments = await readPayments()
    const payment = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload,
    }
    payments.push(payment)
    await writePayments(payments)
    return payment
  })
}

async function findPaymentById(id) {
  const payments = await readPayments()
  return payments.find((payment) => payment.id === id) || null
}

async function updatePayment(id, updater) {
  return queueWrite(async () => {
    const payments = await readPayments()
    const index = payments.findIndex((payment) => payment.id === id)
    if (index < 0) return null

    const current = payments[index]
    const nextPayment = typeof updater === 'function'
      ? updater(current)
      : { ...current, ...updater }

    payments[index] = {
      ...nextPayment,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }

    await writePayments(payments)
    return payments[index]
  })
}

async function listPayments() {
  return readPayments()
}

async function listPaymentsByUser(userId) {
  const payments = await readPayments()
  return payments.filter((payment) => payment.userId === userId)
}

function queueWrite(task) {
  return storageEngine.runWithCollectionLock('payments', task)
}

module.exports = {
  createPayment,
  findPaymentById,
  listPayments,
  listPaymentsByUser,
  updatePayment,
}
