import { useState } from 'react'
import { StatCard } from '../../shared/StatCard'

// ═══════════════════════════════════════════════════════════════════════════
//  BANCO DE DADOS DE MUTAÇÕES DO TARIN (Carduelis cucullata)
//  Fonte: "Tarin e suas Mutações" - Alexandre Assis Pereira (Revista CCCC)
//         "Simplificando as Mutações dos Tarins" - Décio Junior
//         Extraídos do fórum Universo dos Canários
// ═══════════════════════════════════════════════════════════════════════════

const MUTACOES_INFO = {
  Ancestral:       { tipo: 'base',        heranca: '-',             desc: 'Fenótipo selvagem original do Tarin (Carduelis cucullata)', cor: '#C62828' },
  Diluído:         { tipo: 'melanina',     heranca: 'dominante',     desc: 'Mutação dominante (Aa). Também chamada de Pastel. Derivada do Lugano.', cor: '#EF5350' },
  'Duplo Diluído': { tipo: 'melanina',     heranca: 'dominante',     desc: 'Homozigoto dominante (AA). Diluição dupla, aparência muito clara.', cor: '#FFCDD2' },
  Canela:          { tipo: 'melanina',     heranca: 'sexo-ligada',   desc: 'Mutação sexo-ligada (Bruno). Fêmeas não são portadoras. Melanina marrom.', cor: '#8D6E63' },
  Ágata:           { tipo: 'melanina',     heranca: 'sexo-ligada',   desc: 'Mutação sexo-ligada. Redução e redistribuição da melanina. Rara no Brasil.', cor: '#90A4AE' },
  Isabel:          { tipo: 'melanina',     heranca: 'sexo-ligada',   desc: 'Combinação de Ágata + Canela. Sexo-ligada. Melanina castanho claro.', cor: '#BCAAA4' },
  Topázio:         { tipo: 'melanina',     heranca: 'recessiva',     desc: 'Mutação recessiva. Pouco documentada no Brasil. Relatada na Itália.', cor: '#FFB74D' },
  Rubino:          { tipo: 'melanina',     heranca: 'recessiva',     desc: 'Mutação relatada em site espanhol. Melanina muito reduzida, vermelho intenso.', cor: '#E53935' },
  'Queixo Vermelho':{ tipo: 'melanina',    heranca: 'especial',      desc: 'Não decomposição da melanina vermelha abaixo do bico. Exclusiva nacional. Criadouro Marbella.', cor: '#D32F2F' },
  Passepartout:    { tipo: 'genótipo',     heranca: 'sexo-ligada',   desc: 'Macho portador de Ágata, Canela e Isabel simultaneamente. Fenótipo ancestral.', cor: '#7E57C2' },
}

// ─── FENÓTIPOS DE MACHO ─────────────────────────────────────────────────
const FENOTIPOS_MACHO = [
  { id: 'anc',      nome: 'Ancestral',                       mutacao: 'Ancestral',   portador: [] },
  { id: 'anc_pCan', nome: 'Ancestral port. Canela',          mutacao: 'Ancestral',   portador: ['Canela'] },
  { id: 'anc_pAga', nome: 'Ancestral port. Ágata',           mutacao: 'Ancestral',   portador: ['Ágata'] },
  { id: 'anc_pIsb', nome: 'Ancestral port. Isabel',          mutacao: 'Ancestral',   portador: ['Isabel'] },
  { id: 'anc_pass', nome: 'Ancestral Passepartout',          mutacao: 'Ancestral',   portador: ['Ágata', 'Canela', 'Isabel'] },
  { id: 'can',      nome: 'Canela',                          mutacao: 'Canela',      portador: [] },
  { id: 'can_pIsb', nome: 'Canela port. Isabel',             mutacao: 'Canela',      portador: ['Isabel'] },
  { id: 'aga',      nome: 'Ágata',                           mutacao: 'Ágata',       portador: [] },
  { id: 'aga_pIsb', nome: 'Ágata port. Isabel',              mutacao: 'Ágata',       portador: ['Isabel'] },
  { id: 'isb',      nome: 'Isabel',                          mutacao: 'Isabel',      portador: [] },
  { id: 'dil',      nome: 'Diluído',                         mutacao: 'Diluído',     portador: [] },
  { id: 'ddil',     nome: 'Duplo Diluído',                   mutacao: 'Duplo Diluído', portador: [] },
]

// ─── FENÓTIPOS DE FÊMEA (não portam sexo-ligadas) ──────────────────────
const FENOTIPOS_FEMEA = [
  { id: 'anc',  nome: 'Ancestral',       mutacao: 'Ancestral',      portador: [] },
  { id: 'can',  nome: 'Canela',          mutacao: 'Canela',         portador: [] },
  { id: 'aga',  nome: 'Ágata',           mutacao: 'Ágata',          portador: [] },
  { id: 'isb',  nome: 'Isabel',          mutacao: 'Isabel',         portador: [] },
  { id: 'dil',  nome: 'Diluída',         mutacao: 'Diluído',        portador: [] },
  { id: 'ddil', nome: 'Dupla Diluída',   mutacao: 'Duplo Diluído',  portador: [] },
]

// ═══════════════════════════════════════════════════════════════════════════
//  MOTOR GENÉTICO - Regras reais de herança do Tarin
// ═══════════════════════════════════════════════════════════════════════════

function calcularCruzamentoDiluicao(paiMut, maeMut) {
  // Diluição é DOMINANTE: aa=Ancestral, Aa=Diluído, AA=Duplo Diluído
  const paiGen = paiMut === 'Duplo Diluído' ? 'AA' : paiMut === 'Diluído' ? 'Aa' : 'aa'
  const maeGen = maeMut === 'Duplo Diluído' ? 'AA' : maeMut === 'Diluído' ? 'Aa' : 'aa'

  const resultados = []
  const alleles = []
  for (const p of paiGen) {
    for (const m of maeGen) {
      alleles.push([p, m].sort().reverse().join(''))
    }
  }

  const counts = {}
  alleles.forEach(a => { counts[a] = (counts[a] || 0) + 1 })

  const fenMap = { 'AA': 'Duplo Diluído', 'Aa': 'Diluído', 'aA': 'Diluído', 'aa': 'Ancestral' }

  for (const [gen, count] of Object.entries(counts)) {
    const pct = (count / 4) * 100
    const fen = fenMap[gen] || 'Ancestral'
    resultados.push({
      fenotipo: fen,
      genotipo: gen,
      probabilidade: pct,
      mutacoes: fen === 'Ancestral' ? ['Ancestral'] : [fen],
      sexo: 'ambos',
    })
  }
  return resultados
}

function calcularCruzamentoSexoLigado(paiId, maeId) {
  const pai = FENOTIPOS_MACHO.find(f => f.id === paiId)
  const mae = FENOTIPOS_FEMEA.find(f => f.id === maeId)
  if (!pai || !mae) return []

  const paiMut = pai.mutacao
  const maeMut = mae.mutacao
  const paiPort = pai.portador

  // Verificar se é cruzamento de diluição
  const isDilPai = ['Diluído', 'Duplo Diluído'].includes(paiMut)
  const isDilMae = ['Diluído', 'Duplo Diluído'].includes(maeMut)
  if (isDilPai || isDilMae) {
    return calcularCruzamentoDiluicao(paiMut, maeMut)
  }

  // Mutações sexo-ligadas: Canela, Ágata, Isabel
  const sexoLigadas = ['Canela', 'Ágata', 'Isabel']
  const paiSL = sexoLigadas.includes(paiMut) ? paiMut : null
  const maeSL = sexoLigadas.includes(maeMut) ? maeMut : null
  const paiPortSL = paiPort.filter(p => sexoLigadas.includes(p))

  // ─── TABELA COMPLETA DE CRUZAMENTOS SEXO-LIGADOS ────────────────────
  // Baseada no documento "Simplificando as Mutações dos Tarins" - Décio Junior

  const resultados = []

  // Caso: ambos ancestrais puros
  if (paiMut === 'Ancestral' && paiPortSL.length === 0 && maeMut === 'Ancestral') {
    return [
      { fenotipo: 'Macho Ancestral', probabilidade: 50, mutacoes: ['Ancestral'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ancestral', probabilidade: 50, mutacoes: ['Ancestral'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho mutado × Fêmea mesma mutação (ex: Canela × Canela)
  if (paiSL && maeSL && paiSL === maeSL) {
    return [
      { fenotipo: `Macho ${paiSL}`, probabilidade: 50, mutacoes: [paiSL], sexo: 'macho' },
      { fenotipo: `Fêmea ${paiSL}`, probabilidade: 50, mutacoes: [paiSL], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho mutado × Fêmea Ancestral
  if (paiSL && maeMut === 'Ancestral') {
    return [
      { fenotipo: `Macho Ancestral port. ${paiSL}`, probabilidade: 50, mutacoes: ['Ancestral', paiSL], sexo: 'macho' },
      { fenotipo: `Fêmea ${paiSL}`, probabilidade: 50, mutacoes: [paiSL], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ancestral puro × Fêmea mutada
  if (paiMut === 'Ancestral' && paiPortSL.length === 0 && maeSL) {
    return [
      { fenotipo: `Macho Ancestral port. ${maeSL}`, probabilidade: 50, mutacoes: ['Ancestral', maeSL], sexo: 'macho' },
      { fenotipo: 'Fêmea Ancestral', probabilidade: 50, mutacoes: ['Ancestral'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ancestral portador × Fêmea com mesma mutação portada
  if (paiMut === 'Ancestral' && paiPortSL.length === 1 && maeSL && paiPortSL[0] === maeSL) {
    const mut = paiPortSL[0]
    return [
      { fenotipo: `Macho Ancestral port. ${mut}`, probabilidade: 25, mutacoes: ['Ancestral', mut], sexo: 'macho' },
      { fenotipo: `Macho ${mut}`, probabilidade: 25, mutacoes: [mut], sexo: 'macho' },
      { fenotipo: 'Fêmea Ancestral', probabilidade: 25, mutacoes: ['Ancestral'], sexo: 'fêmea' },
      { fenotipo: `Fêmea ${mut}`, probabilidade: 25, mutacoes: [mut], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ancestral portador × Fêmea Ancestral
  if (paiMut === 'Ancestral' && paiPortSL.length === 1 && maeMut === 'Ancestral') {
    const mut = paiPortSL[0]
    return [
      { fenotipo: `Macho Ancestral port. ${mut}`, probabilidade: 25, mutacoes: ['Ancestral', mut], sexo: 'macho' },
      { fenotipo: 'Macho Ancestral', probabilidade: 25, mutacoes: ['Ancestral'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ancestral', probabilidade: 25, mutacoes: ['Ancestral'], sexo: 'fêmea' },
      { fenotipo: `Fêmea ${mut}`, probabilidade: 25, mutacoes: [mut], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ágata × Fêmea Canela = Passepartout!
  if (paiSL === 'Ágata' && maeSL === 'Canela') {
    return [
      { fenotipo: 'Macho Ancestral Passepartout (port. Ágata, Canela e Isabel)', probabilidade: 50, mutacoes: ['Passepartout'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ágata', probabilidade: 50, mutacoes: ['Ágata'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Canela × Fêmea Ágata (inverso)
  if (paiSL === 'Canela' && maeSL === 'Ágata') {
    return [
      { fenotipo: 'Macho Ancestral Passepartout (port. Ágata, Canela e Isabel)', probabilidade: 50, mutacoes: ['Passepartout'], sexo: 'macho' },
      { fenotipo: 'Fêmea Canela', probabilidade: 50, mutacoes: ['Canela'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ágata × Fêmea Isabel
  if (paiSL === 'Ágata' && maeSL === 'Isabel') {
    return [
      { fenotipo: 'Macho Ágata port. Isabel', probabilidade: 50, mutacoes: ['Ágata', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ágata', probabilidade: 50, mutacoes: ['Ágata'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Canela × Fêmea Isabel
  if (paiSL === 'Canela' && maeSL === 'Isabel') {
    return [
      { fenotipo: 'Macho Canela port. Isabel', probabilidade: 50, mutacoes: ['Canela', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Canela', probabilidade: 50, mutacoes: ['Canela'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Isabel × Fêmea Ágata
  if (paiSL === 'Isabel' && maeSL === 'Ágata') {
    return [
      { fenotipo: 'Macho Ágata port. Isabel', probabilidade: 50, mutacoes: ['Ágata', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 50, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Isabel × Fêmea Canela
  if (paiSL === 'Isabel' && maeSL === 'Canela') {
    return [
      { fenotipo: 'Macho Canela port. Isabel', probabilidade: 50, mutacoes: ['Canela', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 50, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Isabel × Fêmea Ancestral
  if (paiSL === 'Isabel' && maeMut === 'Ancestral') {
    return [
      { fenotipo: 'Macho Ancestral port. Isabel', probabilidade: 50, mutacoes: ['Ancestral', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 50, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Isabel × Fêmea Isabel
  if (paiSL === 'Isabel' && maeSL === 'Isabel') {
    return [
      { fenotipo: 'Macho Isabel', probabilidade: 50, mutacoes: ['Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 50, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ágata portador de Isabel × Fêmea Isabel
  if (paiMut === 'Ágata' && paiPort.includes('Isabel') && maeSL === 'Isabel') {
    return [
      { fenotipo: 'Macho Ágata port. Isabel', probabilidade: 25, mutacoes: ['Ágata', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Macho Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ágata', probabilidade: 25, mutacoes: ['Ágata'], sexo: 'fêmea' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ágata portador de Isabel × Fêmea Ágata
  if (paiMut === 'Ágata' && paiPort.includes('Isabel') && maeSL === 'Ágata') {
    return [
      { fenotipo: 'Macho Ágata port. Isabel', probabilidade: 25, mutacoes: ['Ágata', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Macho Ágata', probabilidade: 25, mutacoes: ['Ágata'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ágata', probabilidade: 25, mutacoes: ['Ágata'], sexo: 'fêmea' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Canela portador de Isabel × Fêmea Isabel
  if (paiMut === 'Canela' && paiPort.includes('Isabel') && maeSL === 'Isabel') {
    return [
      { fenotipo: 'Macho Canela port. Isabel', probabilidade: 25, mutacoes: ['Canela', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Macho Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Canela', probabilidade: 25, mutacoes: ['Canela'], sexo: 'fêmea' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Canela portador de Isabel × Fêmea Canela
  if (paiMut === 'Canela' && paiPort.includes('Isabel') && maeSL === 'Canela') {
    return [
      { fenotipo: 'Macho Canela port. Isabel', probabilidade: 25, mutacoes: ['Canela', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Macho Canela', probabilidade: 25, mutacoes: ['Canela'], sexo: 'macho' },
      { fenotipo: 'Fêmea Canela', probabilidade: 25, mutacoes: ['Canela'], sexo: 'fêmea' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ancestral portador de Isabel × Fêmea Isabel
  if (paiMut === 'Ancestral' && paiPort.includes('Isabel') && maeSL === 'Isabel') {
    return [
      { fenotipo: 'Macho Ancestral port. Isabel', probabilidade: 25, mutacoes: ['Ancestral', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Macho Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ancestral', probabilidade: 25, mutacoes: ['Ancestral'], sexo: 'fêmea' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Ancestral portador de Isabel × Fêmea Ancestral
  if (paiMut === 'Ancestral' && paiPort.includes('Isabel') && maeMut === 'Ancestral') {
    return [
      { fenotipo: 'Macho Ancestral port. Isabel', probabilidade: 25, mutacoes: ['Ancestral', 'Isabel'], sexo: 'macho' },
      { fenotipo: 'Macho Ancestral', probabilidade: 25, mutacoes: ['Ancestral'], sexo: 'macho' },
      { fenotipo: 'Fêmea Ancestral', probabilidade: 25, mutacoes: ['Ancestral'], sexo: 'fêmea' },
      { fenotipo: 'Fêmea Isabel', probabilidade: 25, mutacoes: ['Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Passepartout × Fêmea Ágata
  if (pai.id === 'anc_pass' && maeSL === 'Ágata') {
    return [
      { fenotipo: 'Macho Passepartout (div. Ancestral/Ágata/Isabel)', probabilidade: 50, mutacoes: ['Passepartout'], sexo: 'macho' },
      { fenotipo: 'Fêmea (div. Ancestral/Canela/Ágata/Isabel)', probabilidade: 50, mutacoes: ['Canela', 'Ágata', 'Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Macho Passepartout × Fêmea Ancestral
  if (pai.id === 'anc_pass' && maeMut === 'Ancestral') {
    return [
      { fenotipo: 'Macho Ancestral (port. variado)', probabilidade: 50, mutacoes: ['Ancestral', 'Passepartout'], sexo: 'macho' },
      { fenotipo: 'Fêmea (div. Canela/Ágata/Isabel)', probabilidade: 50, mutacoes: ['Canela', 'Ágata', 'Isabel'], sexo: 'fêmea' },
    ]
  }

  // Caso: Mutação diferente entre sexo-ligadas (genérico)
  if (paiSL && maeSL && paiSL !== maeSL) {
    return [
      { fenotipo: `Macho Ancestral port. ${paiSL}`, probabilidade: 50, mutacoes: ['Ancestral', paiSL], sexo: 'macho' },
      { fenotipo: `Fêmea ${paiSL}`, probabilidade: 50, mutacoes: [paiSL], sexo: 'fêmea' },
    ]
  }

  // Fallback genérico
  return [
    { fenotipo: 'Macho (fenótipo variável)', probabilidade: 50, mutacoes: [paiMut], sexo: 'macho' },
    { fenotipo: 'Fêmea (fenótipo variável)', probabilidade: 50, mutacoes: [maeMut], sexo: 'fêmea' },
  ]
}

// ─── CORES DAS BADGES ──────────────────────────────────────────────────
const MUTATION_COLORS = {
  Ancestral:         { bg: 'rgba(198,40,40,0.15)',   text: '#EF5350', border: 'rgba(198,40,40,0.30)' },
  'Diluído':         { bg: 'rgba(239,83,80,0.12)',   text: '#EF9A9A', border: 'rgba(239,83,80,0.25)' },
  'Duplo Diluído':   { bg: 'rgba(255,205,210,0.15)', text: '#FFCDD2', border: 'rgba(255,205,210,0.30)' },
  Canela:            { bg: 'rgba(141,110,99,0.20)',  text: '#BCAAA4', border: 'rgba(141,110,99,0.35)' },
  'Ágata':           { bg: 'rgba(144,164,174,0.18)', text: '#B0BEC5', border: 'rgba(144,164,174,0.30)' },
  Isabel:            { bg: 'rgba(188,170,164,0.18)', text: '#D7CCC8', border: 'rgba(188,170,164,0.30)' },
  'Topázio':         { bg: 'rgba(255,183,77,0.15)',  text: '#FFB74D', border: 'rgba(255,183,77,0.30)' },
  Rubino:            { bg: 'rgba(229,57,53,0.15)',   text: '#E53935', border: 'rgba(229,57,53,0.30)' },
  'Queixo Vermelho': { bg: 'rgba(211,47,47,0.15)',   text: '#EF5350', border: 'rgba(211,47,47,0.30)' },
  Passepartout:      { bg: 'rgba(126,87,194,0.15)',  text: '#B39DDB', border: 'rgba(126,87,194,0.30)' },
}
const DEFAULT_BADGE = { bg: 'rgba(90,122,92,0.20)', text: '#5A7A5C', border: 'rgba(90,122,92,0.35)' }

// ─── COMPONENTE BADGE ──────────────────────────────────────────────────
function MutationBadge({ mutation, size = 'normal' }) {
  const c = MUTATION_COLORS[mutation] || DEFAULT_BADGE
  const isSmall = size === 'small'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: isSmall ? '2px 8px' : '3px 12px',
      fontSize: isSmall ? 10 : 11, fontFamily: "'DM Mono', monospace",
      fontWeight: 500, letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: isSmall ? 5 : 6, height: isSmall ? 5 : 6, borderRadius: '50%',
        background: c.text, marginRight: isSmall ? 4 : 6, opacity: 0.8, flexShrink: 0,
      }} />
      {mutation}
    </span>
  )
}

// ─── SEXO BADGE ────────────────────────────────────────────────────────
function SexoBadge({ sexo }) {
  const isMacho = sexo === 'macho'
  const color = isMacho ? '#5BC0EB' : '#E88DB4'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontFamily: "'DM Mono', monospace",
      color, opacity: 0.8,
    }}>
      {isMacho ? '♂' : sexo === 'fêmea' ? '♀' : '♂♀'}
      <span style={{ fontSize: 9 }}>{sexo === 'ambos' ? 'M/F' : isMacho ? 'Macho' : 'Fêmea'}</span>
    </span>
  )
}

// ─── INFO PANEL ────────────────────────────────────────────────────────
function MutacaoInfoPanel({ mutacao }) {
  const info = MUTACOES_INFO[mutacao]
  if (!info) return null
  const herancaLabels = {
    'dominante': 'Dominante Incompleta',
    'sexo-ligada': 'Sexo-Ligada',
    'recessiva': 'Recessiva',
    'especial': 'Especial',
    '-': 'Tipo Selvagem',
  }
  return (
    <div style={{
      background: 'rgba(21,40,24,0.5)', border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 10, padding: '10px 14px', marginTop: 10,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: info.cor, flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, color: '#8A9E8C', fontFamily: "'DM Mono', monospace" }}>
          {herancaLabels[info.heranca]} — {info.tipo}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#6A8A6C', lineHeight: 1.5 }}>
        {info.desc}
      </div>
    </div>
  )
}

// ─── MODAL DE DETALHES ─────────────────────────────────────────────────
function SimulationDetailModal({ sim, onClose }) {
  if (!sim) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'rgba(21,40,24,0.95)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 32, width: '90%', maxWidth: 700, maxHeight: '85vh',
        overflowY: 'auto', position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #D4A017, #F5A623)', opacity: 0.7,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F2EDE4', margin: 0 }}>
            Detalhes do Cruzamento
          </h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
            color: '#5A7A5C', borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>X</button>
        </div>

        {/* Pais */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(91,192,235,0.15)',
            borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 200,
          }}>
            <div style={{ fontSize: 10, color: '#5BC0EB', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 4 }}>
              ♂ Pai (Macho)
            </div>
            <div style={{ fontSize: 15, color: '#F2EDE4', fontWeight: 600, marginBottom: 6 }}>{sim.pai.nome}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <MutationBadge mutation={sim.pai.mutacao} size="small" />
              {sim.pai.portador.map(p => (
                <span key={p} style={{ fontSize: 10, color: '#6A8A6C', fontFamily: "'DM Mono', monospace" }}>port. {p}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#D4A017', fontSize: 20, fontWeight: 700 }}>×</div>
          <div style={{
            background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(232,141,180,0.15)',
            borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 200,
          }}>
            <div style={{ fontSize: 10, color: '#E88DB4', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 4 }}>
              ♀ Mãe (Fêmea)
            </div>
            <div style={{ fontSize: 15, color: '#F2EDE4', fontWeight: 600, marginBottom: 6 }}>{sim.mae.nome}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <MutationBadge mutation={sim.mae.mutacao} size="small" />
            </div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 10 }}>
          Filhotes possíveis ({sim.resultados.length})
        </div>

        {sim.resultados.map((r, i) => (
          <div key={i} style={{
            background: 'rgba(21,40,24,0.5)', border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: `conic-gradient(#D4A017 0% ${r.probabilidade}%, rgba(90,122,92,0.25) ${r.probabilidade}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8, background: 'rgba(21,40,24,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#D4A017', fontWeight: 700,
              }}>{r.probabilidade}%</div>
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <SexoBadge sexo={r.sexo} />
                <span style={{ fontSize: 13, color: '#F2EDE4', fontWeight: 500 }}>{r.fenotipo}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  MÓDULO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function MutacoesModule() {
  const [paiId, setPaiId]           = useState('')
  const [maeId, setMaeId]           = useState('')
  const [resultados, setResultados] = useState(null)
  const [historico, setHistorico]   = useState([])
  const [detailSim, setDetailSim]   = useState(null)
  const [animating, setAnimating]   = useState(false)
  const [showGuide, setShowGuide]   = useState(false)

  const pai = FENOTIPOS_MACHO.find(f => f.id === paiId)
  const mae = FENOTIPOS_FEMEA.find(f => f.id === maeId)

  const totalCruzamentos = FENOTIPOS_MACHO.length * FENOTIPOS_FEMEA.length

  const handleSimular = () => {
    if (!pai || !mae) return
    setAnimating(true)
    setResultados(null)

    setTimeout(() => {
      const outcomes = calcularCruzamentoSexoLigado(paiId, maeId)
      setResultados(outcomes)
      setAnimating(false)

      const entry = {
        id: historico.length + 1,
        pai: { ...pai },
        mae: { ...mae },
        data: new Date().toLocaleDateString('pt-BR'),
        resultados: outcomes,
      }
      setHistorico(h => [entry, ...h])
    }, 800)
  }

  const selectStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'rgba(10,26,12,0.8)', border: '1px solid rgba(255,255,255,0.07)',
    color: '#F2EDE4', fontSize: 14, fontFamily: "'DM Mono', monospace",
    outline: 'none', cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235A7A5C' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  }

  return (
    <div>
      {/* ─── HEADER COM ESPÉCIE ───────────────────────────────── */}
      <div style={{
        background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F2EDE4', margin: 0 }}>
            Simulador Genético — Tarin
          </h2>
          <div style={{ fontSize: 12, color: '#6A8A6C', fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
            <em>Carduelis cucullata</em> — Cardinalino del Venezuela
          </div>
        </div>
        <button onClick={() => setShowGuide(!showGuide)} style={{
          background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)',
          color: '#D4A017', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
          fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 600,
        }}>
          {showGuide ? 'Fechar Guia' : 'Guia de Mutações'}
        </button>
      </div>

      {/* ─── GUIA DE MUTAÇÕES ─────────────────────────────────── */}
      {showGuide && (
        <div style={{
          background: 'rgba(21,40,24,0.8)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F2EDE4', margin: '0 0 16px' }}>
            Catálogo de Mutações do Tarin
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {Object.entries(MUTACOES_INFO).map(([nome, info]) => (
              <div key={nome} style={{
                background: 'rgba(10,26,12,0.5)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: info.cor, flexShrink: 0 }} />
                  <MutationBadge mutation={nome} />
                  <span style={{
                    fontSize: 9, color: '#5A7A5C', fontFamily: "'DM Mono', monospace",
                    background: 'rgba(90,122,92,0.15)', padding: '2px 6px', borderRadius: 4,
                  }}>
                    {info.heranca === '-' ? 'SELVAGEM' : info.heranca.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#6A8A6C', lineHeight: 1.5 }}>{info.desc}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, padding: 16, background: 'rgba(212,160,23,0.06)',
            border: '1px solid rgba(212,160,23,0.15)', borderRadius: 10,
          }}>
            <div style={{ fontSize: 12, color: '#D4A017', fontWeight: 600, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
              REGRAS DE HERANÇA
            </div>
            <div style={{ fontSize: 11, color: '#8A9E8C', lineHeight: 1.8 }}>
              <strong style={{ color: '#EF9A9A' }}>Dominante (Diluição):</strong> aa=Ancestral, Aa=Diluído, AA=Duplo Diluído. Não existe portador.<br />
              <strong style={{ color: '#B0BEC5' }}>Sexo-Ligada (Canela, Ágata, Isabel):</strong> Fêmeas NÃO são portadoras. Machos podem portar sem exteriorizar.<br />
              <strong style={{ color: '#FFB74D' }}>Recessiva (Topázio):</strong> Necessita dois alelos para se manifestar.<br />
              <strong style={{ color: '#B39DDB' }}>Passepartout:</strong> Macho portador de Ágata + Canela + Isabel simultaneamente. Obtido de Ágata × Canela.
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 12, textAlign: 'center' }}>
            Fontes: Alexandre Assis Pereira (Revista CCCC) · Décio Junior · Hugo Santana · Criadouro Marbella
          </div>
        </div>
      )}

      {/* ─── STAT CARDS ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Simulações Realizadas" value={historico.length} desc="nesta sessão" color="#D4A017" />
        <StatCard label="Mutações Catalogadas" value={Object.keys(MUTACOES_INFO).length} desc="tipos de Tarin" color="#EF5350" />
        <StatCard label="Fenótipos Macho" value={FENOTIPOS_MACHO.length} desc="incl. portadores" color="#5BC0EB" />
        <StatCard label="Cruzamentos Possíveis" value={totalCruzamentos} desc="combinações" color="#9B8EC4" />
      </div>

      {/* ─── SELEÇÃO DE PAIS ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'stretch', marginBottom: 24 }}>
        {/* PAI */}
        <div style={{
          background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #5BC0EB, #4CAF7D)', opacity: 0.6 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(91,192,235,0.12)', border: '1px solid rgba(91,192,235,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#5BC0EB',
            }}>♂</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F2EDE4' }}>Pai (Macho)</div>
              <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>Selecione o reprodutor</div>
            </div>
          </div>

          <select value={paiId} onChange={e => { setPaiId(e.target.value); setResultados(null) }} style={selectStyle}>
            <option value="">-- Escolha o fenótipo --</option>
            {FENOTIPOS_MACHO.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>

          {pai && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                <MutationBadge mutation={pai.mutacao} />
                {pai.portador.map(p => (
                  <span key={p} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'rgba(126,87,194,0.12)', color: '#B39DDB',
                    border: '1px solid rgba(126,87,194,0.25)', borderRadius: 20,
                    padding: '3px 12px', fontSize: 11, fontFamily: "'DM Mono', monospace",
                  }}>
                    port. {p}
                  </span>
                ))}
              </div>
              <MutacaoInfoPanel mutacao={pai.mutacao} />
            </div>
          )}

          {!pai && (
            <div style={{
              marginTop: 14, padding: '20px 16px', borderRadius: 10,
              background: 'rgba(10,26,12,0.5)', border: '1px dashed rgba(255,255,255,0.04)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>♂</div>
              <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace" }}>Nenhum macho selecionado</div>
            </div>
          )}
        </div>

        {/* CONECTOR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: animating ? 'linear-gradient(135deg, #D4A017, #F5A623)' : 'rgba(21,40,24,0.8)',
            border: '2px solid rgba(212,160,23,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.4s ease',
            boxShadow: animating ? '0 0 20px rgba(212,160,23,0.3)' : 'none',
          }}>
            <span style={{
              fontSize: 18, fontWeight: 700, color: animating ? '#0A1A0C' : '#D4A017',
              fontFamily: "'DM Serif Display', serif",
            }}>×</span>
          </div>
          <div style={{ width: 2, height: 30, background: 'rgba(212,160,23,0.15)', marginTop: 6 }} />
        </div>

        {/* MÃE */}
        <div style={{
          background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #E88DB4, #9B8EC4)', opacity: 0.6 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(232,141,180,0.12)', border: '1px solid rgba(232,141,180,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#E88DB4',
            }}>♀</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F2EDE4' }}>Mãe (Fêmea)</div>
              <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>Selecione a matriz</div>
            </div>
          </div>

          <select value={maeId} onChange={e => { setMaeId(e.target.value); setResultados(null) }} style={selectStyle}>
            <option value="">-- Escolha o fenótipo --</option>
            {FENOTIPOS_FEMEA.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>

          {mae && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                <MutationBadge mutation={mae.mutacao} />
              </div>
              <MutacaoInfoPanel mutacao={mae.mutacao} />
              <div style={{
                marginTop: 8, padding: '6px 10px', borderRadius: 6,
                background: 'rgba(232,141,180,0.08)', border: '1px solid rgba(232,141,180,0.15)',
                fontSize: 10, color: '#E88DB4', fontFamily: "'DM Mono', monospace",
              }}>
                ♀ Fêmeas não são portadoras de mutações sexo-ligadas
              </div>
            </div>
          )}

          {!mae && (
            <div style={{
              marginTop: 14, padding: '20px 16px', borderRadius: 10,
              background: 'rgba(10,26,12,0.5)', border: '1px dashed rgba(255,255,255,0.04)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>♀</div>
              <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace" }}>Nenhuma fêmea selecionada</div>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTÃO SIMULAR ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <button onClick={handleSimular} disabled={!pai || !mae || animating} style={{
          background: pai && mae && !animating ? 'linear-gradient(135deg, #D4A017, #B8860B)' : 'rgba(90,122,92,0.2)',
          color: pai && mae && !animating ? '#0A1A0C' : '#5A7A5C',
          border: 'none', borderRadius: 12, padding: '14px 48px',
          fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.06em', cursor: pai && mae && !animating ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          boxShadow: pai && mae && !animating ? '0 4px 20px rgba(212,160,23,0.25)' : 'none',
        }}>
          {animating ? 'Calculando genética...' : 'Simular Cruzamento'}
        </button>
      </div>

      {/* ─── ANIMAÇÃO ─────────────────────────────────────────── */}
      {animating && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%', background: '#D4A017',
                animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate`, opacity: 0.5,
              }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginTop: 10 }}>
            Aplicando regras de herança (dominante / sexo-ligada / recessiva)...
          </div>
          <style>{`@keyframes pulse { to { opacity: 1; transform: scale(1.3); } }`}</style>
        </div>
      )}

      {/* ─── RESULTADOS ───────────────────────────────────────── */}
      {resultados && !animating && (
        <div style={{
          background: 'rgba(21,40,24,0.8)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 28, marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #D4A017, #F5A623, #D4A017)', opacity: 0.7 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#F2EDE4', margin: 0, marginBottom: 4 }}>
                Resultado do Cruzamento
              </h3>
              <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
                {pai.nome} <span style={{ color: '#D4A017', fontWeight: 700 }}> × </span> {mae.nome}
              </div>
            </div>
            <div style={{
              background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)',
              borderRadius: 10, padding: '8px 16px',
            }}>
              <span style={{ fontSize: 11, color: '#D4A017', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                {resultados.length} fenótipos possíveis
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {resultados.map((r, i) => (
              <div key={i} style={{
                background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 12, padding: '18px 16px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: `${r.probabilidade}%`, height: 2,
                  background: 'linear-gradient(90deg, #D4A017, #F5A623)', opacity: 0.5,
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <SexoBadge sexo={r.sexo} />
                  <div style={{
                    background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)',
                    borderRadius: 8, padding: '3px 10px',
                    fontSize: 13, fontFamily: "'DM Mono', monospace", color: '#D4A017', fontWeight: 700,
                  }}>{r.probabilidade}%</div>
                </div>
                <div style={{ fontSize: 14, color: '#F2EDE4', fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>
                  {r.fenotipo}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {r.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
                </div>
              </div>
            ))}
          </div>

          {/* Barra de distribuição */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>
              Distribuição de probabilidade
            </div>
            <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
              {resultados.map((r, i) => {
                const colors = ['#D4A017', '#5BC0EB', '#E88DB4', '#4CAF7D', '#9B8EC4', '#F5A623']
                return (
                  <div key={i} style={{
                    width: `${r.probabilidade}%`, background: colors[i % colors.length],
                    opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontFamily: "'DM Mono', monospace", color: '#0A1A0C', fontWeight: 700,
                    borderRight: i < resultados.length - 1 ? '1px solid rgba(10,26,12,0.5)' : 'none',
                  }} title={`${r.fenotipo}: ${r.probabilidade}%`}>
                    {r.probabilidade >= 15 ? `${r.probabilidade}%` : ''}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── HISTÓRICO ────────────────────────────────────────── */}
      {historico.length > 0 && (
        <div style={{
          background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #7A9E7C, #5A7A5C)', opacity: 0.5 }} />
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F2EDE4', margin: 0, marginBottom: 16 }}>
            Histórico de Simulações
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Pai ♂', 'Mãe ♀', 'Data', 'Resultados', 'Ações'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#5A7A5C',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map(sim => (
                  <tr key={sim.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>{sim.id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, color: '#F2EDE4', fontWeight: 500 }}>{sim.pai.nome}</div>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                        <MutationBadge mutation={sim.pai.mutacao} size="small" />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, color: '#F2EDE4', fontWeight: 500 }}>{sim.mae.nome}</div>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                        <MutationBadge mutation={sim.mae.mutacao} size="small" />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#8A9E8C', fontFamily: "'DM Mono', monospace" }}>{sim.data}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: 'rgba(212,160,23,0.1)', color: '#D4A017',
                        border: '1px solid rgba(212,160,23,0.25)',
                        borderRadius: 8, padding: '3px 10px',
                        fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                      }}>{sim.resultados.length} fenótipos</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => setDetailSim(sim)} style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                        color: '#7A9E7C', borderRadius: 8, padding: '6px 14px',
                        fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: 'pointer',
                      }}>Ver detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {historico.length === 0 && !animating && !resultados && (
        <div style={{
          background: 'rgba(21,40,24,0.4)', border: '1px dashed rgba(255,255,255,0.04)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>🧬</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#5A7A5C', marginBottom: 6 }}>
            Nenhuma simulação realizada
          </div>
          <div style={{ fontSize: 12, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Selecione o fenótipo do pai e da mãe acima para simular o cruzamento.
            Os resultados seguem as regras reais de herança genética do Tarin
            (dominante, sexo-ligada e recessiva).
          </div>
        </div>
      )}

      <SimulationDetailModal sim={detailSim} onClose={() => setDetailSim(null)} />
    </div>
  )
}
