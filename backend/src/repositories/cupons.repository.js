const crypto = require('crypto')
const storageEngine = require('./storage.engine')

function uid() {
  return crypto.randomUUID()
}

async function readCollection(name) {
  const items = await storageEngine.readCollection(name)
  return Array.isArray(items) ? items : []
}

async function writeCollection(name, items) {
  return storageEngine.writeCollection(name, items)
}

function normalizeCupomCodigo(codigo = '') {
  return String(codigo || '').toUpperCase().replace(/\s+/g, '').trim()
}

// ─── CUPONS ──────────────────────────────────────────────────────────────────

async function listCupons() {
  return readCollection('cupons')
}

async function findCupomByCodigo(codigo) {
  const code = normalizeCupomCodigo(codigo)
  if (!code) return null
  const cupons = await listCupons()
  return cupons.find((c) => normalizeCupomCodigo(c.codigo) === code) || null
}

async function findCupomById(id) {
  const cupons = await listCupons()
  return cupons.find((c) => c.id === id) || null
}

async function findCuponsByCaptadorEmail(email) {
  if (!email) return []
  const cupons = await listCupons()
  const target = String(email).trim().toLowerCase()
  return cupons.filter((c) => String(c.captadorEmail || '').toLowerCase() === target)
}

async function createCupom(data) {
  const cupons = await listCupons()
  const codigo = normalizeCupomCodigo(data.codigo)
  if (cupons.some((c) => normalizeCupomCodigo(c.codigo) === codigo)) {
    const err = new Error('Código de cupom já existe.')
    err.code = 'CUPOM_EXISTS'
    throw err
  }

  const now = new Date().toISOString()
  const cupom = {
    id: uid(),
    codigo,
    captadorNome: String(data.captadorNome || '').trim(),
    captadorEmail: String(data.captadorEmail || '').trim().toLowerCase(),
    captadorUserId: data.captadorUserId || null,
    pixChave: String(data.pixChave || '').trim(),
    tier: data.tier || 'bronze',
    descontoPercentual: Number(data.descontoPercentual ?? 15),
    comissaoPercentual: Number(data.comissaoPercentual ?? 20),
    comissaoDuracaoMeses: Number(data.comissaoDuracaoMeses ?? 12),
    status: data.status || 'ativo',
    observacao: String(data.observacao || '').trim(),
    totalIndicacoes: 0,
    totalCreditado: 0,
    totalPago: 0,
    createdAt: now,
    updatedAt: now,
  }
  cupons.push(cupom)
  await writeCollection('cupons', cupons)
  return cupom
}

async function updateCupom(id, patch) {
  const cupons = await listCupons()
  const idx = cupons.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const current = cupons[idx]
  const next = {
    ...current,
    ...patch,
    codigo: patch.codigo ? normalizeCupomCodigo(patch.codigo) : current.codigo,
    captadorEmail: (patch.captadorEmail ?? current.captadorEmail ?? '').toLowerCase().trim(),
    updatedAt: new Date().toISOString(),
  }
  cupons[idx] = next
  await writeCollection('cupons', cupons)
  return next
}

async function deleteCupom(id) {
  const cupons = await listCupons()
  const next = cupons.filter((c) => c.id !== id)
  if (next.length === cupons.length) return false
  await writeCollection('cupons', next)
  return true
}

// ─── INDICAÇÕES ──────────────────────────────────────────────────────────────

async function listIndicacoes() {
  return readCollection('indicacoes')
}

async function listIndicacoesByCupomId(cupomId) {
  const all = await listIndicacoes()
  return all.filter((i) => i.cupomId === cupomId)
}

async function createIndicacao(data) {
  const all = await listIndicacoes()
  const now = new Date().toISOString()
  const item = {
    id: uid(),
    cupomId: data.cupomId,
    cupomCodigo: data.cupomCodigo,
    usuarioId: data.usuarioId || null,
    usuarioEmail: data.usuarioEmail || null,
    paymentId: data.paymentId || null,
    plano: data.plano || null,
    valorBruto: Number(data.valorBruto || 0),
    valorLiquido: Number(data.valorLiquido || 0),
    descontoAplicado: Number(data.descontoAplicado || 0),
    comissaoCredito: Number(data.comissaoCredito || 0),
    status: data.status || 'pending',
    liberadaEm: data.liberadaEm || null,
    createdAt: now,
  }
  all.push(item)
  await writeCollection('indicacoes', all)
  return item
}

// ─── MOVIMENTOS DE CRÉDITO ───────────────────────────────────────────────────

async function listMovimentos() {
  return readCollection('creditos_movimentos')
}

async function listMovimentosByCupomId(cupomId) {
  const all = await listMovimentos()
  return all.filter((m) => m.cupomId === cupomId)
}

async function createMovimento(data) {
  const all = await listMovimentos()
  const now = new Date().toISOString()
  const item = {
    id: uid(),
    cupomId: data.cupomId,
    cupomCodigo: data.cupomCodigo,
    tipo: data.tipo,                           // 'credit' | 'payout' | 'adjust'
    valor: Number(data.valor || 0),            // positivo (credit) ou negativo (payout/adjust)
    descricao: data.descricao || '',
    indicacaoId: data.indicacaoId || null,
    liberadaEm: data.liberadaEm || null,       // carência antes de virar sacável
    createdAt: now,
  }
  all.push(item)
  await writeCollection('creditos_movimentos', all)
  return item
}

async function calcularSaldo(cupomId) {
  const movs = await listMovimentosByCupomId(cupomId)
  const now = new Date()
  let saldoTotal = 0
  let saldoSacavel = 0
  let totalCreditado = 0
  let totalPago = 0

  for (const m of movs) {
    saldoTotal += Number(m.valor || 0)
    if (m.tipo === 'credit') totalCreditado += Number(m.valor || 0)
    if (m.tipo === 'payout') totalPago += Math.abs(Number(m.valor || 0))
    // Sacável = crédito com liberadaEm <= now + payouts (que são negativos)
    if (m.tipo === 'credit') {
      if (!m.liberadaEm || new Date(m.liberadaEm) <= now) {
        saldoSacavel += Number(m.valor || 0)
      }
    } else {
      saldoSacavel += Number(m.valor || 0)
    }
  }

  return {
    saldoTotal: Math.round(saldoTotal * 100) / 100,
    saldoSacavel: Math.round(saldoSacavel * 100) / 100,
    totalCreditado: Math.round(totalCreditado * 100) / 100,
    totalPago: Math.round(totalPago * 100) / 100,
  }
}

module.exports = {
  normalizeCupomCodigo,
  // cupons
  listCupons,
  findCupomByCodigo,
  findCupomById,
  findCuponsByCaptadorEmail,
  createCupom,
  updateCupom,
  deleteCupom,
  // indicacoes
  listIndicacoes,
  listIndicacoesByCupomId,
  createIndicacao,
  // creditos
  listMovimentos,
  listMovimentosByCupomId,
  createMovimento,
  calcularSaldo,
}
