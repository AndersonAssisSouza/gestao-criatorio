import { useState, useMemo, useEffect } from 'react'
import { StatCard } from '../../shared/StatCard'
import { mutacoesService } from '../../../services/mutacoes.service'
import { useAuth } from '../../../context/AuthContext'

// ═══════════════════════════════════════════════════════════════════════════
//  SIMULADOR GENÉTICO — TARIM (Carduelis cucullata)
//  Fonte: "TARIM - Acasalamentos entre mutações" — Décio Junior
//  Lookup table replicando a lista SharePoint MutacaoTarin do Power Apps
// ═══════════════════════════════════════════════════════════════════════════

// ─── CORES POR MUTAÇÃO ──────────────────────────────────────────────────
export const MUTATION_COLORS = {
  'Ancestral':              '#EF5350',
  'Canela':                 '#BCAAA4',
  'Pastel':                 '#E88DB4',
  'Canela Pastel':          '#CE93D8',
  'Topázio':                '#FFB74D',
  'Diluído':                '#EF9A9A',
  'Duplo Diluído':          '#FFCDD2',
  'Port. Canela':           '#D7CCC8',
  'Port. Pastel':           '#F3B9D1',
  'Port. Topázio':          '#FFD699',
  'Portador de Canela':     '#D7CCC8',
  'Portador de Pastel':     '#F3B9D1',
  'Portador de Topázio':    '#FFD699',
  'Passepartout Tipo I':    '#B39DDB',
  'Passepartout Tipo II':   '#B39DDB',
  'Passepartout':           '#B39DDB',
  'Canela Port. CP':        '#D1A6D9',
  'Pastel Port. CP':        '#D9A6C8',
  'Port. Canela Pastel':    '#C9A6D9',
  'Port. CP':               '#C9A6D9',
  'Port. CP(tipo II)':      '#C9A6D9',
}

export function getMutationColor(name) {
  if (MUTATION_COLORS[name]) return MUTATION_COLORS[name]
  if (name.includes('Passepartout')) return '#B39DDB'
  if (name.includes('Port.') || name.includes('Portador')) return '#C5B8A0'
  return '#8A9A8C'
}

// ─── LEGENDAS POR MUTAÇÃO ───────────────────────────────────────────────
const MUTATION_LEGENDS = {
  'Ancestral':              'Fenótipo selvagem original. Genótipo: XX (macho) / Xy (fêmea)',
  'Canela':                 'Mutação sexo-ligada. Melanina marrom. Genótipo: CC (macho) / Cy (fêmea)',
  'Pastel':                 'Mutação sexo-ligada (diluída). Genótipo: PP (macho) / Py (fêmea)',
  'Canela Pastel':          'Combinação sexo-ligada. Genótipo: CPCP (macho) / CPy (fêmea)',
  'Topázio':                'Mutação autossômica recessiva. Genótipo: TT',
  'Port. Topázio':          'Portador heterozigoto. Genótipo: Tt',
  'Portador de Topázio':    'Portador heterozigoto. Genótipo: Tt',
  'Diluído':                'Mutação autossômica dominante. Genótipo: Dd',
  'Duplo Diluído':          'Homozigoto dominante. Genótipo: DD',
  'Port. Canela':           'Portador sexo-ligado. Genótipo: XC',
  'Portador de Canela':     'Portador sexo-ligado. Genótipo: XC',
  'Port. Pastel':           'Portador sexo-ligado. Genótipo: XP',
  'Portador de Pastel':     'Portador sexo-ligado. Genótipo: XP',
  'Passepartout Tipo I':    'Port. canela pastel (de CP×Ancestral). Genótipo: XCP',
  'Passepartout Tipo II':   'Port. canela pastel (de Canela×Pastel). Genótipo: XCP. Crossing-over diferente do Tipo I',
  'Passepartout':           'Portador de canela e pastel simultaneamente. Genótipo: XCP',
  'Canela Port. CP':        'Canela portador de canela pastel. Genótipo: C/CP',
  'Pastel Port. CP':        'Pastel portador de canela pastel. Genótipo: P/CP',
  'Port. Canela Pastel':    'Portador sexo-ligado de canela pastel. Genótipo: X/CP',
  'Port. CP':               'Portador sexo-ligado de canela pastel. Genótipo: X/CP',
  'Port. CP(tipo II)':      'Portador canela pastel tipo II (crossing-over). Genótipo: X/CP',
}

function getMutationLegend(name) {
  if (MUTATION_LEGENDS[name]) return MUTATION_LEGENDS[name]
  return ''
}

// ═══════════════════════════════════════════════════════════════════════════
//  BANCO DE DADOS DE CRUZAMENTOS — 51 entradas (Décio Junior)
//  Cada entrada: especie, macho, femea, resultadoMachos[], resultadoFemeas[]
//  isCrossingOver: true para cruzamentos com Passepartout (sem %)
// ═══════════════════════════════════════════════════════════════════════════

export const CROSSING_DB = [
  // ── 1. Ancestral × Ancestral ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Ancestral',
    resultadoMachos: [{ mutacao: 'Ancestral', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Ancestral', percentual: '100%' }],
  },
  // ── 2. Ancestral × Canela ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Canela',
    resultadoMachos: [{ mutacao: 'Portador de Canela', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Ancestral', percentual: '100%' }],
  },
  // ── 3. Ancestral × Pastel ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Pastel',
    resultadoMachos: [{ mutacao: 'Portador de Pastel', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Ancestral', percentual: '100%' }],
  },
  // ── 4. Ancestral × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Canela Pastel',
    resultadoMachos: [{ mutacao: 'Passepartout Tipo I', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Ancestral', percentual: '100%' }],
  },
  // ── 5. Ancestral × Topázio ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Topázio',
    resultadoMachos: [{ mutacao: 'Portador de Topázio', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Portador de Topázio', percentual: '100%' }],
  },
  // ── 6. Ancestral × Port. Topázio ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Port. Topázio',
    resultadoMachos: [
      { mutacao: 'Port. Topázio', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Port. Topázio', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '50%' },
    ],
  },

  // ── 7. Port. Canela × Ancestral ──
  {
    especie: 'Tarin', macho: 'Port. Canela', femea: 'Ancestral',
    resultadoMachos: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Port. Canela', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Canela', percentual: '50%' },
    ],
  },
  // ── 8. Port. Canela × Canela ──
  {
    especie: 'Tarin', macho: 'Port. Canela', femea: 'Canela',
    resultadoMachos: [
      { mutacao: 'Port. Canela', percentual: '50%' },
      { mutacao: 'Canela', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Canela', percentual: '50%' },
    ],
  },
  // ── 9. Port. Canela × Pastel ──
  {
    especie: 'Tarin', macho: 'Port. Canela', femea: 'Pastel',
    resultadoMachos: [
      { mutacao: 'Port. Canela Pastel', percentual: '50%' },
      { mutacao: 'Port. Pastel', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Canela', percentual: '50%' },
    ],
  },
  // ── 10. Port. Canela × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Port. Canela', femea: 'Canela Pastel',
    resultadoMachos: [
      { mutacao: 'Passepartout Tipo I', percentual: '50%' },
      { mutacao: 'Canela Port. CP', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Canela', percentual: '50%' },
    ],
  },

  // ── 11. Port. Pastel × Ancestral ──
  {
    especie: 'Tarin', macho: 'Port. Pastel', femea: 'Ancestral',
    resultadoMachos: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Port. Pastel', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Pastel', percentual: '50%' },
    ],
  },
  // ── 12. Port. Pastel × Canela ──
  {
    especie: 'Tarin', macho: 'Port. Pastel', femea: 'Canela',
    resultadoMachos: [
      { mutacao: 'Port. Canela', percentual: '50%' },
      { mutacao: 'Port. Canela Pastel', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Pastel', percentual: '50%' },
    ],
  },
  // ── 13. Port. Pastel × Pastel ──
  {
    especie: 'Tarin', macho: 'Port. Pastel', femea: 'Pastel',
    resultadoMachos: [
      { mutacao: 'Pastel', percentual: '50%' },
      { mutacao: 'Port. Pastel', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Pastel', percentual: '50%' },
    ],
  },
  // ── 14. Port. Pastel × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Port. Pastel', femea: 'Canela Pastel',
    resultadoMachos: [
      { mutacao: 'Passepartout Tipo I', percentual: '50%' },
      { mutacao: 'Pastel Port. CP', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Pastel', percentual: '50%' },
    ],
  },

  // ── 15. Passepartout × Ancestral (crossing-over) ──
  {
    especie: 'Tarin', macho: 'Passepartout', femea: 'Ancestral',
    isCrossingOver: true,
    resultadoNormal: {
      machos: [
        { mutacao: 'Ancestral', percentual: '' },
        { mutacao: 'Passepartout', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Ancestral', percentual: '' },
        { mutacao: 'Canela Pastel', percentual: '' },
      ],
    },
    resultadoCrossOver: {
      machos: [
        { mutacao: 'Port. Canela', percentual: '' },
        { mutacao: 'Port. Pastel', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Canela', percentual: '' },
        { mutacao: 'Pastel', percentual: '' },
      ],
    },
  },
  // ── 16. Passepartout × Canela (crossing-over) ──
  {
    especie: 'Tarin', macho: 'Passepartout', femea: 'Canela',
    isCrossingOver: true,
    resultadoNormal: {
      machos: [
        { mutacao: 'Port. Canela', percentual: '' },
        { mutacao: 'Canela Port. CP', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Ancestral', percentual: '' },
        { mutacao: 'Canela Pastel', percentual: '' },
      ],
    },
    resultadoCrossOver: {
      machos: [
        { mutacao: 'Canela', percentual: '' },
        { mutacao: 'Port. CP(tipo II)', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Canela', percentual: '' },
        { mutacao: 'Pastel', percentual: '' },
      ],
    },
  },
  // ── 17. Passepartout × Pastel (crossing-over) ──
  {
    especie: 'Tarin', macho: 'Passepartout', femea: 'Pastel',
    isCrossingOver: true,
    resultadoNormal: {
      machos: [
        { mutacao: 'Port. Pastel', percentual: '' },
        { mutacao: 'Pastel Port. CP', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Ancestral', percentual: '' },
        { mutacao: 'Canela Pastel', percentual: '' },
      ],
    },
    resultadoCrossOver: {
      machos: [
        { mutacao: 'Port. CP(tipo II)', percentual: '' },
        { mutacao: 'Pastel', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Canela', percentual: '' },
        { mutacao: 'Pastel', percentual: '' },
      ],
    },
  },
  // ── 18. Passepartout × Canela Pastel (crossing-over) ──
  {
    especie: 'Tarin', macho: 'Passepartout', femea: 'Canela Pastel',
    isCrossingOver: true,
    resultadoNormal: {
      machos: [
        { mutacao: 'Passepartout Tipo I', percentual: '' },
        { mutacao: 'Canela Pastel', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Ancestral', percentual: '' },
        { mutacao: 'Canela Pastel', percentual: '' },
      ],
    },
    resultadoCrossOver: {
      machos: [
        { mutacao: 'Canela Port. CP', percentual: '' },
        { mutacao: 'Pastel Port. CP', percentual: '' },
      ],
      femeas: [
        { mutacao: 'Canela', percentual: '' },
        { mutacao: 'Pastel', percentual: '' },
      ],
    },
  },

  // ── 19. Port. Topázio × Ancestral ──
  {
    especie: 'Tarin', macho: 'Port. Topázio', femea: 'Ancestral',
    resultadoMachos: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Ancestral', percentual: '50%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
    ],
  },
  // ── 20. Port. Topázio × Topázio ──
  {
    especie: 'Tarin', macho: 'Port. Topázio', femea: 'Topázio',
    resultadoMachos: [
      { mutacao: 'Topázio', percentual: '50%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Topázio', percentual: '50%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
    ],
  },
  // ── 21. Port. Topázio × Port. Topázio ──
  {
    especie: 'Tarin', macho: 'Port. Topázio', femea: 'Port. Topázio',
    resultadoMachos: [
      { mutacao: 'Topázio', percentual: '25%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '25%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Topázio', percentual: '25%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '25%' },
    ],
  },

  // ── 22. Canela × Ancestral ──
  {
    especie: 'Tarin', macho: 'Canela', femea: 'Ancestral',
    resultadoMachos: [{ mutacao: 'Port. Canela', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela', percentual: '100%' }],
  },
  // ── 23. Canela × Canela ──
  {
    especie: 'Tarin', macho: 'Canela', femea: 'Canela',
    resultadoMachos: [{ mutacao: 'Canela', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela', percentual: '100%' }],
  },
  // ── 24. Canela × Pastel ──
  {
    especie: 'Tarin', macho: 'Canela', femea: 'Pastel',
    resultadoMachos: [{ mutacao: 'Passepartout Tipo II', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela', percentual: '100%' }],
  },
  // ── 25. Canela × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Canela', femea: 'Canela Pastel',
    resultadoMachos: [{ mutacao: 'Canela Port. CP', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela', percentual: '100%' }],
  },

  // ── 26. Canela Port. CP × Ancestral ──
  {
    especie: 'Tarin', macho: 'Canela Port. CP', femea: 'Ancestral',
    resultadoMachos: [
      { mutacao: 'Port. Canela', percentual: '50%' },
      { mutacao: 'Port. CP', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Canela', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },
  // ── 27. Canela Port. CP × Canela ──
  {
    especie: 'Tarin', macho: 'Canela Port. CP', femea: 'Canela',
    resultadoMachos: [
      { mutacao: 'Canela', percentual: '50%' },
      { mutacao: 'Canela Port. CP', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Canela', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },
  // ── 28. Canela Port. CP × Pastel ──
  {
    especie: 'Tarin', macho: 'Canela Port. CP', femea: 'Pastel',
    resultadoMachos: [
      { mutacao: 'Pastel Port. CP', percentual: '50%' },
      { mutacao: 'Passepartout Tipo II', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Canela', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },
  // ── 29. Canela Port. CP × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Canela Port. CP', femea: 'Canela Pastel',
    resultadoMachos: [
      { mutacao: 'Canela Port. CP', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Canela', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },

  // ── 30. Pastel × Ancestral ──
  {
    especie: 'Tarin', macho: 'Pastel', femea: 'Ancestral',
    resultadoMachos: [{ mutacao: 'Port. Pastel', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Pastel', percentual: '100%' }],
  },
  // ── 31. Pastel × Canela ──
  {
    especie: 'Tarin', macho: 'Pastel', femea: 'Canela',
    resultadoMachos: [{ mutacao: 'Passepartout Tipo II', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Pastel', percentual: '100%' }],
  },
  // ── 32. Pastel × Pastel ──
  {
    especie: 'Tarin', macho: 'Pastel', femea: 'Pastel',
    resultadoMachos: [{ mutacao: 'Pastel', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Pastel', percentual: '100%' }],
  },
  // ── 33. Pastel × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Pastel', femea: 'Canela Pastel',
    resultadoMachos: [{ mutacao: 'Pastel Port. CP', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Pastel', percentual: '100%' }],
  },

  // ── 34. Pastel Port. CP × Ancestral ──
  {
    especie: 'Tarin', macho: 'Pastel Port. CP', femea: 'Ancestral',
    resultadoMachos: [
      { mutacao: 'Port. Pastel', percentual: '50%' },
      { mutacao: 'Port. CP', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Pastel', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },
  // ── 35. Pastel Port. CP × Canela ──
  {
    especie: 'Tarin', macho: 'Pastel Port. CP', femea: 'Canela',
    resultadoMachos: [
      { mutacao: 'Passepartout Tipo II', percentual: '50%' },
      { mutacao: 'Canela Port. CP', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Pastel', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },
  // ── 36. Pastel Port. CP × Pastel ──
  {
    especie: 'Tarin', macho: 'Pastel Port. CP', femea: 'Pastel',
    resultadoMachos: [
      { mutacao: 'Pastel', percentual: '50%' },
      { mutacao: 'Pastel Port. CP', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Pastel', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },
  // ── 37. Pastel Port. CP × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Pastel Port. CP', femea: 'Canela Pastel',
    resultadoMachos: [
      { mutacao: 'Pastel Port. CP', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Pastel', percentual: '50%' },
      { mutacao: 'Canela Pastel', percentual: '50%' },
    ],
  },

  // ── 38. Canela Pastel × Ancestral ──
  {
    especie: 'Tarin', macho: 'Canela Pastel', femea: 'Ancestral',
    resultadoMachos: [{ mutacao: 'Passepartout Tipo I', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela Pastel', percentual: '100%' }],
  },
  // ── 39. Canela Pastel × Canela ──
  {
    especie: 'Tarin', macho: 'Canela Pastel', femea: 'Canela',
    resultadoMachos: [{ mutacao: 'Canela Port. CP', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela Pastel', percentual: '100%' }],
  },
  // ── 40. Canela Pastel × Pastel ──
  {
    especie: 'Tarin', macho: 'Canela Pastel', femea: 'Pastel',
    resultadoMachos: [{ mutacao: 'Pastel Port. CP', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela Pastel', percentual: '100%' }],
  },
  // ── 41. Canela Pastel × Canela Pastel ──
  {
    especie: 'Tarin', macho: 'Canela Pastel', femea: 'Canela Pastel',
    resultadoMachos: [{ mutacao: 'Canela Pastel', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Canela Pastel', percentual: '100%' }],
  },

  // ── 42. Topázio × Ancestral ──
  {
    especie: 'Tarin', macho: 'Topázio', femea: 'Ancestral',
    resultadoMachos: [{ mutacao: 'Port. Topázio', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Port. Topázio', percentual: '100%' }],
  },
  // ── 43. Topázio × Topázio ──
  {
    especie: 'Tarin', macho: 'Topázio', femea: 'Topázio',
    resultadoMachos: [{ mutacao: 'Topázio', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Topázio', percentual: '100%' }],
  },
  // ── 44. Topázio × Port. Topázio ──
  {
    especie: 'Tarin', macho: 'Topázio', femea: 'Port. Topázio',
    resultadoMachos: [
      { mutacao: 'Topázio', percentual: '50%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Topázio', percentual: '50%' },
      { mutacao: 'Port. Topázio', percentual: '50%' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  DILUIÇÃO — Autossômica dominante, independente de sexo
  // ═══════════════════════════════════════════════════════════════

  // ── 45. Diluído × Ancestral ──
  {
    especie: 'Tarin', macho: 'Diluído', femea: 'Ancestral',
    sexIndependent: true,
    resultadoMachos: [
      { mutacao: 'Diluído', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Diluído', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '50%' },
    ],
  },
  // ── 46. Ancestral × Diluído ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Diluído',
    sexIndependent: true,
    resultadoMachos: [
      { mutacao: 'Diluído', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Diluído', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '50%' },
    ],
  },
  // ── 47. Diluído × Diluído ──
  {
    especie: 'Tarin', macho: 'Diluído', femea: 'Diluído',
    sexIndependent: true,
    resultadoMachos: [
      { mutacao: 'Duplo Diluído', percentual: '25%' },
      { mutacao: 'Diluído', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '25%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Duplo Diluído', percentual: '25%' },
      { mutacao: 'Diluído', percentual: '50%' },
      { mutacao: 'Ancestral', percentual: '25%' },
    ],
  },
  // ── 48. Duplo Diluído × Ancestral ──
  {
    especie: 'Tarin', macho: 'Duplo Diluído', femea: 'Ancestral',
    sexIndependent: true,
    resultadoMachos: [{ mutacao: 'Diluído', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Diluído', percentual: '100%' }],
  },
  // ── 49. Ancestral × Duplo Diluído ──
  {
    especie: 'Tarin', macho: 'Ancestral', femea: 'Duplo Diluído',
    sexIndependent: true,
    resultadoMachos: [{ mutacao: 'Diluído', percentual: '100%' }],
    resultadoFemeas: [{ mutacao: 'Diluído', percentual: '100%' }],
  },
  // ── 50. Duplo Diluído × Diluído ──
  {
    especie: 'Tarin', macho: 'Duplo Diluído', femea: 'Diluído',
    sexIndependent: true,
    resultadoMachos: [
      { mutacao: 'Duplo Diluído', percentual: '50%' },
      { mutacao: 'Diluído', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Duplo Diluído', percentual: '50%' },
      { mutacao: 'Diluído', percentual: '50%' },
    ],
  },
  // ── 51. Diluído × Duplo Diluído ──
  {
    especie: 'Tarin', macho: 'Diluído', femea: 'Duplo Diluído',
    sexIndependent: true,
    resultadoMachos: [
      { mutacao: 'Duplo Diluído', percentual: '50%' },
      { mutacao: 'Diluído', percentual: '50%' },
    ],
    resultadoFemeas: [
      { mutacao: 'Duplo Diluído', percentual: '50%' },
      { mutacao: 'Diluído', percentual: '50%' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════
//  ESPÉCIES DISPONÍVEIS
// ═══════════════════════════════════════════════════════════════════════════
const SPECIES = ['Tarin']

const EMPTY_MUTATION_FORM = {
  Especie: '',
  MutacaoMacho: '',
  LegendaMutacaoMacho: '',
  MutacaoFemea: '',
  LegendaMutacaoFemea: '',
  MutacaoFilhoteMacho: '',
  LegendaFilhoteMacho: '',
  MutacaoFilhoteFemea: '',
  LegendaFilhoteFemea: '',
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

function CustomSelect({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <div className="p-field mb-2">
      <label className="p-label">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="p-select"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function MutationBadge({ name, percentual }) {
  const color = getMutationColor(name)
  return (
    <div className="flex items-center gap-1" style={{
      padding: '8px 14px', borderRadius: 8,
      background: `${color}18`, border: `1px solid ${color}40`,
      marginBottom: 6,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span className="text-main" style={{ fontSize: 13, flex: 1 }}>{name}</span>
      {percentual && (
        <span style={{ fontSize: 12, color, fontWeight: 600, flexShrink: 0 }}>{percentual}</span>
      )}
    </div>
  )
}

function LegendText({ name }) {
  const legend = getMutationLegend(name)
  if (!legend) return null
  return (
    <div className="text-muted" style={{ fontSize: 11, fontStyle: 'italic', marginTop: -10, marginBottom: 14, paddingLeft: 4, lineHeight: 1.5 }}>
      {legend}
    </div>
  )
}

function ResultSection({ title, icon, results }) {
  return (
    <div className="module-panel" style={{ flex: 1, minWidth: 260, padding: '18px 20px' }}>
      <div className="font-serif flex items-center gap-1" style={{ fontSize: 13, color: '#C95025', marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {title}
      </div>
      {results.map((r, i) => (
        <div key={i}>
          <MutationBadge name={r.mutacao} percentual={r.percentual} />
          <div className="text-muted" style={{ fontSize: 10, marginBottom: 8, paddingLeft: 24, lineHeight: 1.4 }}>
            {getMutationLegend(r.mutacao)}
          </div>
        </div>
      ))}
    </div>
  )
}

function CrossingOverResult({ crossing }) {
  return (
    <div>
      <div style={{ background: 'rgba(179,157,219,0.1)', border: '1px solid rgba(179,157,219,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: '#B39DDB', fontWeight: 600, marginBottom: 4 }}>
          Cruzamento com Passepartout (sem % definido)
        </div>
        <div className="text-muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
          O fenômeno de crossing-over pode alterar os resultados.
          Abaixo estão listados os resultados normais e os possíveis
          resultados por crossing-over.
        </div>
      </div>

      <div className="font-serif mb-1" style={{ fontSize: 12, color: '#8BC34A', letterSpacing: '0.05em' }}>
        Resultado Normal
      </div>
      <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
        <ResultSection title="Filhotes Machos" icon="♂" results={crossing.resultadoNormal.machos} />
        <ResultSection title="Filhotes Fêmeas" icon="♀" results={crossing.resultadoNormal.femeas} />
      </div>

      <div className="font-serif mb-1" style={{ fontSize: 12, color: '#FF9800', letterSpacing: '0.05em' }}>
        Resultado por Crossing-Over
      </div>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        <ResultSection title="Filhotes Machos" icon="♂" results={crossing.resultadoCrossOver.machos} />
        <ResultSection title="Filhotes Fêmeas" icon="♀" results={crossing.resultadoCrossOver.femeas} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function MutacoesModule() {
  const { user } = useAuth()
  const canManageMutations = user?.role === 'owner'
  const [especie, setEspecie] = useState('')
  const [mutacaoMacho, setMutacaoMacho] = useState('')
  const [mutacaoFemea, setMutacaoFemea] = useState('')
  const [mutationRecords, setMutationRecords] = useState([])
  const [mutationForm, setMutationForm] = useState(EMPTY_MUTATION_FORM)
  const [mutationSaving, setMutationSaving] = useState(false)
  const [mutationError, setMutationError] = useState('')
  const [mutationMessage, setMutationMessage] = useState('')

  useEffect(() => {
    let active = true

    if (!import.meta.env.VITE_API_URL) {
      if (active) setMutationRecords([])
      return () => { active = false }
    }

    mutacoesService.list()
      .then((items) => {
        if (active) {
          setMutationRecords(items || [])
        }
      })
      .catch(() => {
        if (active) {
          setMutationRecords([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  const registeredSpecies = useMemo(() => {
    return [...new Set(mutationRecords.map((item) => item.Especie).filter(Boolean))]
  }, [mutationRecords])

  const mutationSpeciesOptions = useMemo(() => {
    return [...new Set([...SPECIES, ...registeredSpecies])].sort((left, right) => left.localeCompare(right, 'pt-BR'))
  }, [registeredSpecies])

  const recentMutations = useMemo(() => {
    return mutationRecords.slice().reverse().slice(0, 10)
  }, [mutationRecords])

  // Mutações disponíveis para macho (filtradas por espécie)
  const machoOptions = useMemo(() => {
    if (!especie) return []
    const machos = [...new Set(CROSSING_DB.filter(c => c.especie === especie).map(c => c.macho))]
    return machos
  }, [especie])

  // Mutações disponíveis para fêmea (filtradas por espécie + macho selecionado)
  const femeaOptions = useMemo(() => {
    if (!especie || !mutacaoMacho) return []
    const femeas = [...new Set(
      CROSSING_DB
        .filter(c => c.especie === especie && c.macho === mutacaoMacho)
        .map(c => c.femea)
    )]
    return femeas
  }, [especie, mutacaoMacho])

  // Resultado do cruzamento
  const crossing = useMemo(() => {
    if (!especie || !mutacaoMacho || !mutacaoFemea) return null
    return CROSSING_DB.find(
      c => c.especie === especie && c.macho === mutacaoMacho && c.femea === mutacaoFemea
    ) || null
  }, [especie, mutacaoMacho, mutacaoFemea])

  const handleEspecieChange = (val) => {
    setEspecie(val)
    setMutacaoMacho('')
    setMutacaoFemea('')
  }

  const handleMachoChange = (val) => {
    setMutacaoMacho(val)
    setMutacaoFemea('')
  }

  const setMutationField = (field, value) => {
    setMutationForm((current) => ({ ...current, [field]: value }))
  }

  const handleCreateMutation = async () => {
    if (!canManageMutations) {
      setMutationError('O cadastro de mutação é exclusivo da conta master.')
      return
    }

    try {
      setMutationSaving(true)
      setMutationError('')
      setMutationMessage('')

      const response = await mutacoesService.create(mutationForm)
      setMutationRecords(response.items || [])
      setMutationForm(EMPTY_MUTATION_FORM)
      setMutationMessage('Mutação cadastrada com sucesso.')
    } catch (error) {
      setMutationError(error.response?.data?.message || 'Não foi possível salvar a mutação.')
    } finally {
      setMutationSaving(false)
    }
  }

  const allSelected = especie && mutacaoMacho && mutacaoFemea && crossing

  return (
    <div>
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Genética aplicada</div>
          <h2 className="module-hero__title">Simulador genético</h2>
          <div className="module-hero__text">
            Simule cruzamentos, visualize probabilidades de mutação e consulte resultados especiais como crossing-over em uma interface mais integrada ao sistema.
          </div>
        </div>
        <div className="pill pill--accent">
          {especie ? `Espécie: ${especie}` : 'Tarim'}
        </div>
      </div>

      {/* Main layout: left selectors + right results */}
      <div className="p-split" style={{ alignItems: 'flex-start' }}>

        {/* LEFT: Selectors */}
        <div className="module-panel" style={{ maxWidth: 380, flexShrink: 0 }}>
          <div className="p-panel-body">
            <div className="font-serif" style={{ fontSize: 14, color: '#C95025', marginBottom: 20 }}>
              Parâmetros do Cruzamento
            </div>

            <CustomSelect label="Espécie" value={especie} onChange={handleEspecieChange} options={SPECIES} placeholder="Selecione a espécie..." />
            <CustomSelect label="Mutação do Macho" value={mutacaoMacho} onChange={handleMachoChange} options={machoOptions} placeholder="Selecione a mutação do macho..." disabled={!especie} />
            {mutacaoMacho && <LegendText name={mutacaoMacho} />}
            <CustomSelect label="Mutação da Fêmea" value={mutacaoFemea} onChange={setMutacaoFemea} options={femeaOptions} placeholder="Selecione a mutação da fêmea..." disabled={!mutacaoMacho} />
            {mutacaoFemea && <LegendText name={mutacaoFemea} />}

            {allSelected && (
              <div className="flex flex-col gap-1 mt-2">
                <StatCard label="Cruzamento" value={`${mutacaoMacho.length > 14 ? mutacaoMacho.slice(0, 12) + '...' : mutacaoMacho}`} desc={`× ${mutacaoFemea}`} color="#C95025" />
                {crossing && crossing.isCrossingOver && (
                  <StatCard label="Tipo" value="Crossing-Over" desc="Sem percentuais definidos" color="#B39DDB" />
                )}
                {crossing && crossing.sexIndependent && (
                  <StatCard label="Herança" value="Autossômica" desc="Dominante — independe do sexo" color="#EF9A9A" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {!allSelected ? (
            <div className="module-empty" style={{ borderStyle: 'dashed', padding: '60px 40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>&#129516;</div>
                <div className="font-serif text-muted" style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
                  Selecione a espécie e mutações do macho e fêmea para o resultado
                  das possibilidades das mutações no nascimento dos filhotes
                </div>
                <div className="text-faint" style={{ fontSize: 11, marginTop: 16 }}>
                  Fonte: TARIM - Acasalamentos entre mutações (Décio Junior)
                </div>
              </div>
            </div>
          ) : crossing.isCrossingOver ? (
            <div className="module-panel">
              <div className="p-panel-body">
                <div className="font-serif" style={{ fontSize: 18, marginBottom: 4 }}>Resultado do Cruzamento</div>
                <div className="text-muted mb-2" style={{ fontSize: 12 }}>{mutacaoMacho} × {mutacaoFemea}</div>
                <CrossingOverResult crossing={crossing} />
              </div>
            </div>
          ) : (
            <div className="module-panel">
              <div className="p-panel-body">
                <div className="font-serif" style={{ fontSize: 18, marginBottom: 4 }}>Resultado do Cruzamento</div>
                <div className="text-muted mb-2" style={{ fontSize: 12 }}>{mutacaoMacho} × {mutacaoFemea}</div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <ResultSection title="Filhotes Machos" icon="♂" results={crossing.resultadoMachos} />
                  <ResultSection title="Filhotes Fêmeas" icon="♀" results={crossing.resultadoFemeas} />
                </div>
                {crossing.sexIndependent && (
                  <div className="mt-2" style={{ background: 'rgba(239,154,154,0.08)', border: '1px solid rgba(239,154,154,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: '#EF9A9A', lineHeight: 1.5 }}>
                      Herança autossômica dominante — os resultados são idênticos para filhotes machos e fêmeas.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mutation Registry */}
      <div className="module-panel mt-3">
        <div className="p-panel-header">
          <div>
            <div className="module-hero__eyebrow">Cadastro de mutações</div>
            <div className="font-serif" style={{ fontSize: 22, marginBottom: 6 }}>Nova mutação</div>
            <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 720 }}>
              Cadastre mutações por espécie para alimentar o restante do sistema. Essas mutações passam a ficar disponíveis no cadastro da ave quando a espécie correspondente for selecionada.
            </div>
            {!canManageMutations && (
              <div className="text-faint mt-1" style={{ fontSize: 12, lineHeight: 1.7 }}>
                O cadastro de mutação fica disponível apenas na sua conta master.
              </div>
            )}
          </div>
          <div style={{ minWidth: 160 }}>
            <StatCard label="Cadastradas" value={mutationRecords.length} desc="regras registradas" color="#C95025" />
          </div>
        </div>

        <div className="p-panel-body">
          {mutationError && <div className="p-alert p-alert--error mb-2">{mutationError}</div>}
          {mutationMessage && <div className="p-alert p-alert--success mb-2">{mutationMessage}</div>}

          {canManageMutations && (
            <>
              <div className="p-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <CustomSelect label="Espécie" value={mutationForm.Especie} onChange={(value) => setMutationField('Especie', value)} options={mutationSpeciesOptions} placeholder="Selecione a espécie..." />
                <div className="p-field"><label className="p-label">Mutação macho</label><input className="p-input" value={mutationForm.MutacaoMacho} onChange={(e) => setMutationField('MutacaoMacho', e.target.value)} /></div>
                <div className="p-field"><label className="p-label">Legenda macho</label><input className="p-input" value={mutationForm.LegendaMutacaoMacho} onChange={(e) => setMutationField('LegendaMutacaoMacho', e.target.value)} /></div>
                <div className="p-field"><label className="p-label">Mutação fêmea</label><input className="p-input" value={mutationForm.MutacaoFemea} onChange={(e) => setMutationField('MutacaoFemea', e.target.value)} /></div>
                <div className="p-field"><label className="p-label">Legenda fêmea</label><input className="p-input" value={mutationForm.LegendaMutacaoFemea} onChange={(e) => setMutationField('LegendaMutacaoFemea', e.target.value)} /></div>
                <div className="p-field"><label className="p-label">Filhote macho</label><input className="p-input" value={mutationForm.MutacaoFilhoteMacho} onChange={(e) => setMutationField('MutacaoFilhoteMacho', e.target.value)} /></div>
                <div className="p-field"><label className="p-label">Legenda filhote macho</label><input className="p-input" value={mutationForm.LegendaFilhoteMacho} onChange={(e) => setMutationField('LegendaFilhoteMacho', e.target.value)} /></div>
                <div className="p-field"><label className="p-label">Filhote fêmea</label><input className="p-input" value={mutationForm.MutacaoFilhoteFemea} onChange={(e) => setMutationField('MutacaoFilhoteFemea', e.target.value)} /></div>
                <div className="p-field"><label className="p-label">Legenda filhote fêmea</label><input className="p-input" value={mutationForm.LegendaFilhoteFemea} onChange={(e) => setMutationField('LegendaFilhoteFemea', e.target.value)} /></div>
              </div>

              <div className="flex justify-end mt-2">
                <button type="button" onClick={handleCreateMutation} disabled={mutationSaving} className="p-btn p-btn--primary">
                  {mutationSaving ? 'Salvando...' : 'Cadastrar mutação'}
                </button>
              </div>
            </>
          )}

          <div className="mt-3">
            <div className="font-serif mb-1" style={{ fontSize: 13 }}>Últimas mutações cadastradas</div>
            <div className="p-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {recentMutations.map((item) => (
                <div key={item.ID} className="module-panel" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#C95025', marginBottom: 8 }}>{item.Especie}</div>
                  <div className="text-main" style={{ fontSize: 13, lineHeight: 1.7 }}>
                    Macho: {item.MutacaoMacho || '-'}<br />
                    Fêmea: {item.MutacaoFemea || '-'}<br />
                    Filhote macho: {item.MutacaoFilhoteMacho || '-'}<br />
                    Filhote fêmea: {item.MutacaoFilhoteFemea || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
