const cuponsRepository = require('../repositories/cupons.repository')
const { SUBSCRIPTION_PRICING } = require('../config/subscription.config')
const { CUPOM_TIERS, CUPOM_RULES, CUPOM_CODIGO_REGEX } = require('../config/cupons.config')
const cupomNotify = require('../services/cupom-notification.service')

function normalizeCode(code) {
  return String(code || '').toUpperCase().replace(/\s+/g, '').trim()
}

function validateCupomPayload(body = {}, { isCreate = false } = {}) {
  const codigo = normalizeCode(body.codigo)
  if (isCreate) {
    if (!codigo) return 'Código do cupom é obrigatório.'
    if (codigo.length < CUPOM_RULES.codigoMinLength) return `Código deve ter pelo menos ${CUPOM_RULES.codigoMinLength} caracteres.`
    if (codigo.length > CUPOM_RULES.codigoMaxLength) return `Código deve ter no máximo ${CUPOM_RULES.codigoMaxLength} caracteres.`
    if (!CUPOM_CODIGO_REGEX.test(codigo)) return 'Código aceita apenas letras, números, hífen e underline.'
  }

  if (body.descontoPercentual !== undefined) {
    const d = Number(body.descontoPercentual)
    if (Number.isNaN(d) || d < 0 || d > CUPOM_RULES.descontoPercentualMaximo) {
      return `Desconto deve estar entre 0 e ${CUPOM_RULES.descontoPercentualMaximo}%.`
    }
  }
  if (body.comissaoPercentual !== undefined) {
    const c = Number(body.comissaoPercentual)
    if (Number.isNaN(c) || c < 0 || c > CUPOM_RULES.comissaoPercentualMaximo) {
      return `Comissão deve estar entre 0 e ${CUPOM_RULES.comissaoPercentualMaximo}%.`
    }
  }
  if (body.comissaoDuracaoMeses !== undefined) {
    const m = Number(body.comissaoDuracaoMeses)
    if (Number.isNaN(m) || m < 0 || m > 60) return 'Duração deve estar entre 0 e 60 meses.'
  }
  if (body.tier && !CUPOM_TIERS[body.tier]) return 'Tier inválido.'
  if (body.status && !['ativo', 'pausado'].includes(body.status)) return 'Status inválido.'

  return null
}

// ─── ADMIN: CRUD ─────────────────────────────────────────────────────────────

async function listCuponsAdmin(_, res) {
  try {
    const cupons = await cuponsRepository.listCupons()
    const enriched = await Promise.all(
      cupons.map(async (c) => {
        const saldo = await cuponsRepository.calcularSaldo(c.id)
        const indicacoes = await cuponsRepository.listIndicacoesByCupomId(c.id)
        return { ...c, saldo, totalIndicacoes: indicacoes.length }
      })
    )
    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return res.json({ items: enriched, tiers: CUPOM_TIERS, rules: CUPOM_RULES })
  } catch (error) {
    console.error('[cupons/list]', error)
    return res.status(500).json({ message: 'Erro ao listar cupons.' })
  }
}

async function createCupomAdmin(req, res) {
  try {
    const error = validateCupomPayload(req.body, { isCreate: true })
    if (error) return res.status(400).json({ message: error })

    const tier = req.body.tier || 'bronze'
    const tierDefaults = CUPOM_TIERS[tier] || CUPOM_TIERS.bronze

    const cupom = await cuponsRepository.createCupom({
      codigo: req.body.codigo,
      captadorNome: req.body.captadorNome,
      captadorEmail: req.body.captadorEmail,
      captadorUserId: req.body.captadorUserId,
      pixChave: req.body.pixChave,
      tier,
      descontoPercentual: req.body.descontoPercentual ?? tierDefaults.descontoPercentual,
      comissaoPercentual: req.body.comissaoPercentual ?? tierDefaults.comissaoPercentual,
      comissaoDuracaoMeses: req.body.comissaoDuracaoMeses ?? tierDefaults.comissaoDuracaoMeses,
      status: req.body.status || 'ativo',
      observacao: req.body.observacao || '',
    })
    return res.status(201).json({ item: cupom })
  } catch (error) {
    if (error.code === 'CUPOM_EXISTS') {
      return res.status(409).json({ message: error.message })
    }
    console.error('[cupons/create]', error)
    return res.status(500).json({ message: 'Erro ao criar cupom.' })
  }
}

async function updateCupomAdmin(req, res) {
  try {
    const error = validateCupomPayload(req.body)
    if (error) return res.status(400).json({ message: error })

    const updated = await cuponsRepository.updateCupom(req.params.id, req.body)
    if (!updated) return res.status(404).json({ message: 'Cupom não encontrado.' })
    return res.json({ item: updated })
  } catch (error) {
    console.error('[cupons/update]', error)
    return res.status(500).json({ message: 'Erro ao atualizar cupom.' })
  }
}

async function deleteCupomAdmin(req, res) {
  try {
    const ok = await cuponsRepository.deleteCupom(req.params.id)
    if (!ok) return res.status(404).json({ message: 'Cupom não encontrado.' })
    return res.json({ message: 'Cupom removido com sucesso.' })
  } catch (error) {
    console.error('[cupons/delete]', error)
    return res.status(500).json({ message: 'Erro ao remover cupom.' })
  }
}

async function registrarPayoutAdmin(req, res) {
  try {
    const cupom = await cuponsRepository.findCupomById(req.params.id)
    if (!cupom) return res.status(404).json({ message: 'Cupom não encontrado.' })

    const valor = Math.abs(Number(req.body.valor || 0))
    if (!valor || valor <= 0) return res.status(400).json({ message: 'Valor do pagamento inválido.' })

    const saldo = await cuponsRepository.calcularSaldo(cupom.id)
    if (valor > saldo.saldoSacavel) {
      return res.status(400).json({ message: `Saldo sacável (R$ ${saldo.saldoSacavel.toFixed(2)}) é menor que o valor informado.` })
    }

    await cuponsRepository.createMovimento({
      cupomId: cupom.id,
      cupomCodigo: cupom.codigo,
      tipo: 'payout',
      valor: -valor,
      descricao: req.body.descricao || `Pagamento via PIX para ${cupom.captadorNome}`,
    })

    // Marca pedidos pendentes desse cupom como pagos (até cobrir o valor)
    const movimentos = await cuponsRepository.listMovimentosByCupomId(cupom.id)
    const pendentes = movimentos
      .filter((m) => m.tipo === 'adjust' && String(m.descricao || '').includes('Saque solicitado') && !String(m.descricao).includes('✅ PAGO'))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    let restante = valor
    for (const p of pendentes) {
      if (restante <= 0) break
      const match = String(p.descricao).match(/R\$\s*([\d.,]+)/)
      const pedidoValor = match ? Number(String(match[1]).replace(/\./g, '').replace(',', '.')) : 0
      if (pedidoValor <= restante + 0.01) {
        // Atualizar o movimento via update genérico (não temos — vamos criar adjust marcando)
        await cuponsRepository.createMovimento({
          cupomId: cupom.id,
          cupomCodigo: cupom.codigo,
          tipo: 'adjust',
          valor: 0,
          descricao: `✅ PAGO — pedido ${p.id.slice(0, 8)} quitado`,
          indicacaoId: p.id,
        })
        restante -= pedidoValor
      }
    }

    const novoSaldo = await cuponsRepository.calcularSaldo(cupom.id)
    // Atualiza totalPago no cupom
    await cuponsRepository.updateCupom(cupom.id, {
      totalPago: Math.round(((cupom.totalPago || 0) + valor) * 100) / 100,
    })

    return res.json({ saldo: novoSaldo, message: 'Pagamento registrado.' })
  } catch (error) {
    console.error('[cupons/payout]', error)
    return res.status(500).json({ message: 'Erro ao registrar pagamento.' })
  }
}

async function detalhesCupomAdmin(req, res) {
  try {
    const cupom = await cuponsRepository.findCupomById(req.params.id)
    if (!cupom) return res.status(404).json({ message: 'Cupom não encontrado.' })

    const indicacoes = await cuponsRepository.listIndicacoesByCupomId(cupom.id)
    const movimentos = await cuponsRepository.listMovimentosByCupomId(cupom.id)
    const saldo = await cuponsRepository.calcularSaldo(cupom.id)

    indicacoes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    movimentos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return res.json({ cupom, saldo, indicacoes, movimentos })
  } catch (error) {
    console.error('[cupons/detalhes]', error)
    return res.status(500).json({ message: 'Erro ao carregar detalhes.' })
  }
}

// ─── PÚBLICO: VALIDAR E APLICAR ──────────────────────────────────────────────

function calcularDesconto(cupom, plano) {
  const basePrice = Number(SUBSCRIPTION_PRICING[plano] || 0)
  const desconto = basePrice * (Number(cupom.descontoPercentual || 0) / 100)
  const valorFinal = Math.max(0, basePrice - desconto)
  return {
    valorOriginal: Math.round(basePrice * 100) / 100,
    desconto: Math.round(desconto * 100) / 100,
    valorFinal: Math.round(valorFinal * 100) / 100,
    descontoPercentual: cupom.descontoPercentual,
  }
}

async function validarCupomPublico(req, res) {
  try {
    const codigo = normalizeCode(req.query.codigo || req.body?.codigo)
    const plano = req.query.plano || req.body?.plano || 'monthly'

    if (!codigo) return res.status(400).json({ message: 'Informe o código do cupom.' })

    const cupom = await cuponsRepository.findCupomByCodigo(codigo)
    if (!cupom) return res.status(404).json({ message: 'Cupom não encontrado.' })
    if (cupom.status !== 'ativo') return res.status(400).json({ message: 'Cupom não está ativo.' })

    // Proteção antifraude: captador não pode usar próprio cupom (verificação só em contexto autenticado)
    const userEmail = String(req?.currentUser?.email || req?.user?.email || '').toLowerCase()
    if (userEmail && cupom.captadorEmail && cupom.captadorEmail === userEmail) {
      return res.status(400).json({ message: 'Você não pode usar seu próprio cupom.' })
    }

    const preview = calcularDesconto(cupom, plano)
    return res.json({
      valido: true,
      cupom: {
        codigo: cupom.codigo,
        captadorNome: cupom.captadorNome,
        tier: cupom.tier,
        descontoPercentual: cupom.descontoPercentual,
      },
      preview,
    })
  } catch (error) {
    console.error('[cupons/validar]', error)
    return res.status(500).json({ message: 'Erro ao validar cupom.' })
  }
}

// ─── INTERNO: REGISTRAR INDICAÇÃO AO CONFIRMAR PAGAMENTO ─────────────────────

/**
 * Verifica se o cupom atingiu os critérios para um tier superior e promove.
 * Retorna { promovido: bool, tierAntigo, tierNovo } se houve upgrade.
 */
async function verificarEPromoverTier(cupomId) {
  const cupom = await cuponsRepository.findCupomById(cupomId)
  if (!cupom) return { promovido: false }

  const indicacoesPagas = cupom.totalIndicacoes || 0
  const tierAtual = cupom.tier || 'bronze'

  // Descobre tier máximo alcançado
  const ordemTiers = ['bronze', 'prata', 'ouro']
  let tierAlvo = tierAtual
  for (const t of ordemTiers) {
    const config = CUPOM_TIERS[t]
    if (config && indicacoesPagas >= config.minIndicacoes) {
      tierAlvo = t
    }
  }

  const idxAtual = ordemTiers.indexOf(tierAtual)
  const idxAlvo = ordemTiers.indexOf(tierAlvo)

  if (idxAlvo > idxAtual) {
    const defaults = CUPOM_TIERS[tierAlvo]
    const atualizado = await cuponsRepository.updateCupom(cupom.id, {
      tier: tierAlvo,
      descontoPercentual: defaults.descontoPercentual,
      comissaoPercentual: defaults.comissaoPercentual,
      comissaoDuracaoMeses: defaults.comissaoDuracaoMeses,
    })

    // Notifica captador sobre upgrade (não bloqueia)
    const tierLabels = Object.fromEntries(
      Object.entries(CUPOM_TIERS).map(([k, v]) => [k, v.label])
    )
    cupomNotify.notifyCaptadorTierUp({
      cupom: atualizado,
      tierAntigo: tierAtual,
      tierNovo: tierAlvo,
      tierLabels,
    }).catch(() => {})

    return { promovido: true, tierAntigo: tierAtual, tierNovo: tierAlvo, cupom: atualizado }
  }

  return { promovido: false }
}

/**
 * Chamado pelo fluxo de pagamento quando uma assinatura é paga.
 * Cria indicação + crédito ao captador + notifica + verifica upgrade de tier.
 */
async function registrarIndicacaoPaga({ codigoCupom, usuarioId, usuarioEmail, paymentId, plano, valorPagoLiquido }) {
  try {
    if (!codigoCupom) return null
    const cupom = await cuponsRepository.findCupomByCodigo(codigoCupom)
    if (!cupom || cupom.status !== 'ativo') return null

    const basePrice = Number(SUBSCRIPTION_PRICING[plano] || 0)
    const comissaoValor = Number(valorPagoLiquido || basePrice) * (Number(cupom.comissaoPercentual || 0) / 100)
    const comissaoArredondada = Math.round(comissaoValor * 100) / 100

    const liberadaEm = new Date(Date.now() + CUPOM_RULES.diasCarenciaCredito * 86_400_000).toISOString()

    const descontoValor = basePrice - Number(valorPagoLiquido || basePrice)

    const indicacao = await cuponsRepository.createIndicacao({
      cupomId: cupom.id,
      cupomCodigo: cupom.codigo,
      usuarioId,
      usuarioEmail,
      paymentId,
      plano,
      valorBruto: basePrice,
      valorLiquido: Number(valorPagoLiquido || basePrice),
      descontoAplicado: Math.round(descontoValor * 100) / 100,
      comissaoCredito: comissaoArredondada,
      status: 'confirmed',
      liberadaEm,
    })

    await cuponsRepository.createMovimento({
      cupomId: cupom.id,
      cupomCodigo: cupom.codigo,
      tipo: 'credit',
      valor: comissaoArredondada,
      descricao: `Comissão referente à indicação #${indicacao.id.slice(0, 8)} (${plano})`,
      indicacaoId: indicacao.id,
      liberadaEm,
    })

    // Atualiza totais no cupom
    await cuponsRepository.updateCupom(cupom.id, {
      totalIndicacoes: (cupom.totalIndicacoes || 0) + 1,
      totalCreditado: Math.round(((cupom.totalCreditado || 0) + comissaoArredondada) * 100) / 100,
    })

    // Notifica captador (fire-and-forget, não bloqueia)
    const saldo = await cuponsRepository.calcularSaldo(cupom.id)
    cupomNotify.notifyCaptadorIndicacao({ cupom, indicacao, saldo }).catch(() => {})

    // Verifica e aplica upgrade de tier se atingiu critérios
    await verificarEPromoverTier(cupom.id)

    return { indicacao, cupom }
  } catch (error) {
    console.error('[cupons/registrarIndicacaoPaga]', error)
    return null
  }
}

// ─── SOLICITAÇÃO DE SAQUE (CAPTADOR) ────────────────────────────────────────

async function solicitarPayout(req, res) {
  try {
    const email = String(req.currentUser?.email || '').toLowerCase()
    if (!email) return res.status(401).json({ message: 'Sessão inválida.' })

    const cupomId = req.params.id
    const cupom = await cuponsRepository.findCupomById(cupomId)
    if (!cupom) return res.status(404).json({ message: 'Cupom não encontrado.' })
    if (String(cupom.captadorEmail || '').toLowerCase() !== email) {
      return res.status(403).json({ message: 'Este cupom não é seu.' })
    }

    const saldo = await cuponsRepository.calcularSaldo(cupomId)
    const valor = Number(req.body?.valor || saldo.saldoSacavel)

    if (!valor || valor <= 0) return res.status(400).json({ message: 'Valor inválido.' })
    if (valor > saldo.saldoSacavel) {
      return res.status(400).json({ message: `Saldo sacável (${saldo.saldoSacavel.toFixed(2)}) é menor que o solicitado.` })
    }
    if (valor < (CUPOM_RULES.saqueMinimo || 50)) {
      return res.status(400).json({ message: `Saque mínimo: R$ ${CUPOM_RULES.saqueMinimo}.` })
    }
    if (!cupom.pixChave) {
      return res.status(400).json({ message: 'Cadastre sua chave PIX antes de solicitar saque. Entre em contato com o administrador.' })
    }

    // Cria um movimento "adjust" (pendente) até admin registrar payout real
    await cuponsRepository.createMovimento({
      cupomId: cupom.id,
      cupomCodigo: cupom.codigo,
      tipo: 'adjust',
      valor: 0, // não afeta saldo — é apenas um registro de solicitação
      descricao: `📨 Saque solicitado: R$ ${valor.toFixed(2)} — aguardando pagamento`,
    })

    // Notifica o admin por email
    cupomNotify.notifyOwnerPayoutRequest({
      cupom,
      valor,
      pixChave: cupom.pixChave,
    }).catch(() => {})

    return res.json({
      message: `Pedido de saque de R$ ${valor.toFixed(2)} registrado. O proprietário será notificado e realizará o PIX em até 72h.`,
    })
  } catch (error) {
    console.error('[cupons/solicitarPayout]', error)
    return res.status(500).json({ message: 'Erro ao solicitar saque.' })
  }
}

// ─── RANKING PÚBLICO ─────────────────────────────────────────────────────────

function maskName(name = '') {
  const s = String(name || '').trim()
  if (!s) return 'Captador Anônimo'
  const parts = s.split(/\s+/)
  if (parts.length === 1) {
    // "Fulano" → "F****"
    return parts[0][0] + '*'.repeat(Math.max(3, parts[0].length - 1))
  }
  // "Fulano da Silva" → "Fulano S."
  const first = parts[0]
  const lastInitial = parts[parts.length - 1][0]
  return `${first} ${lastInitial}.`
}

async function rankingPublico(_, res) {
  try {
    const cupons = await cuponsRepository.listCupons()
    const ativos = cupons.filter((c) => c.status === 'ativo')

    // Ordena por totalIndicacoes desc, depois totalCreditado desc
    ativos.sort((a, b) => {
      const ai = Number(b.totalIndicacoes || 0) - Number(a.totalIndicacoes || 0)
      if (ai !== 0) return ai
      return Number(b.totalCreditado || 0) - Number(a.totalCreditado || 0)
    })

    const top = ativos.slice(0, 10).map((c, idx) => ({
      posicao: idx + 1,
      nome: maskName(c.captadorNome),
      tier: c.tier,
      totalIndicacoes: c.totalIndicacoes || 0,
      // Não retornamos valores monetários exatos em público — só faixa
      faixaGanho: Number(c.totalCreditado || 0) > 0
        ? Number(c.totalCreditado || 0) >= 500
          ? 'R$ 500+'
          : Number(c.totalCreditado || 0) >= 100
            ? 'R$ 100-500'
            : 'até R$ 100'
        : '—',
    }))

    const totalCaptadores = ativos.length
    const totalIndicacoes = ativos.reduce((s, c) => s + (c.totalIndicacoes || 0), 0)

    return res.json({
      top,
      stats: { totalCaptadores, totalIndicacoes },
    })
  } catch (error) {
    console.error('[cupons/ranking]', error)
    return res.status(500).json({ message: 'Erro ao carregar ranking.' })
  }
}

// ─── PEDIDOS DE SAQUE PENDENTES (admin) ──────────────────────────────────────

async function listPayoutRequestsAdmin(_, res) {
  try {
    const movimentos = await cuponsRepository.listMovimentos()
    const cupons = await cuponsRepository.listCupons()

    // IDs de pedidos já marcados como pagos
    const idsPagos = new Set(
      movimentos
        .filter((m) => m.tipo === 'adjust' && String(m.descricao || '').includes('✅ PAGO') && m.indicacaoId)
        .map((m) => m.indicacaoId)
    )

    const pedidos = movimentos
      .filter((m) => m.tipo === 'adjust' && String(m.descricao || '').includes('Saque solicitado'))
      .map((m) => {
        const cupom = cupons.find((c) => c.id === m.cupomId)
        const match = String(m.descricao).match(/R\$\s*([\d.,]+)/)
        const valor = match ? Number(String(match[1]).replace(/\./g, '').replace(',', '.')) : 0
        return {
          id: m.id,
          createdAt: m.createdAt,
          cupomId: m.cupomId,
          cupomCodigo: m.cupomCodigo,
          captadorNome: cupom?.captadorNome,
          captadorEmail: cupom?.captadorEmail,
          pixChave: cupom?.pixChave,
          valor,
          descricao: m.descricao,
          pago: idsPagos.has(m.id),
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const pendentes = pedidos.filter((p) => !p.pago)

    return res.json({ pedidos, pendentes, totalPendentes: pendentes.length, totalValorPendente: pendentes.reduce((s, p) => s + p.valor, 0) })
  } catch (error) {
    console.error('[cupons/payout-requests]', error)
    return res.status(500).json({ message: 'Erro ao carregar pedidos.' })
  }
}

// ─── PAINEL DO CAPTADOR: meus cupons + saldo ────────────────────────────────

async function meuPrograma(req, res) {
  try {
    const email = String(req.currentUser?.email || '').toLowerCase()
    if (!email) return res.status(401).json({ message: 'Sessão inválida.' })

    const cupons = await cuponsRepository.findCuponsByCaptadorEmail(email)
    const result = await Promise.all(
      cupons.map(async (c) => {
        const saldo = await cuponsRepository.calcularSaldo(c.id)
        const indicacoes = await cuponsRepository.listIndicacoesByCupomId(c.id)
        const movimentos = await cuponsRepository.listMovimentosByCupomId(c.id)
        indicacoes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        movimentos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return { cupom: c, saldo, indicacoes, movimentos }
      })
    )

    return res.json({ programas: result, rules: CUPOM_RULES, tiers: CUPOM_TIERS })
  } catch (error) {
    console.error('[cupons/meu-programa]', error)
    return res.status(500).json({ message: 'Erro ao carregar programa.' })
  }
}

module.exports = {
  // admin
  listCuponsAdmin,
  createCupomAdmin,
  updateCupomAdmin,
  deleteCupomAdmin,
  registrarPayoutAdmin,
  detalhesCupomAdmin,
  // público
  validarCupomPublico,
  rankingPublico,
  // captador
  meuPrograma,
  solicitarPayout,
  // admin extra
  listPayoutRequestsAdmin,
  // helper interno
  registrarIndicacaoPaga,
  verificarEPromoverTier,
  calcularDesconto,
}
