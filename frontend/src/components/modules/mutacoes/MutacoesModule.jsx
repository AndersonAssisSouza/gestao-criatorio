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
const MUTATION_COLORS = {
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

function getMutationColor(name) {
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

const CROSSING_DB = [
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
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 11, fontFamily: 'inherit',
        color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', padding: '10px 14px', fontSize: 14,
          fontFamily: 'inherit', color: value ? '#F2EDE4' : '#5A7A5C',
          background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)',
          borderRadius: 8, outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23C95025' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        }}
      >
        <option value="" style={{ color: 'var(--text-muted)' }}>{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt} style={{ color: 'var(--text-main)', background: '#152818' }}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function MutationBadge({ name, percentual }) {
  const color = getMutationColor(name)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 8,
      background: `${color}18`, border: `1px solid ${color}40`,
      marginBottom: 6,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'inherit', fontSize: 13,
        color: 'var(--text-main)', flex: 1,
      }}>
        {name}
      </span>
      {percentual && (
        <span style={{
          fontFamily: 'inherit', fontSize: 12,
          color: color, fontWeight: 600, flexShrink: 0,
        }}>
          {percentual}
        </span>
      )}
    </div>
  )
}

function LegendText({ name }) {
  const legend = getMutationLegend(name)
  if (!legend) return null
  return (
    <div style={{
      fontSize: 11, fontFamily: 'inherit',
      color: 'var(--text-muted)', fontStyle: 'italic', marginTop: -10,
      marginBottom: 14, paddingLeft: 4, lineHeight: 1.5,
    }}>
      {legend}
    </div>
  )
}

function ResultSection({ title, icon, results }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '18px 20px', flex: 1, minWidth: 260,
    }}>
      <div style={{
        fontSize: 13, fontFamily: "'DM Serif Display', serif",
        color: '#C95025', marginBottom: 14, display: 'flex',
        alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {title}
      </div>
      {results.map((r, i) => (
        <div key={i}>
          <MutationBadge name={r.mutacao} percentual={r.percentual} />
          <div style={{
            fontSize: 10, fontFamily: 'inherit',
            color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 24,
            lineHeight: 1.4,
          }}>
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
      {/* Note about crossing-over */}
      <div style={{
        background: 'rgba(179,157,219,0.1)', border: '1px solid rgba(179,157,219,0.3)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 18,
      }}>
        <div style={{
          fontSize: 12, fontFamily: 'inherit',
          color: '#B39DDB', fontWeight: 600, marginBottom: 4,
        }}>
          Cruzamento com Passepartout (sem % definido)
        </div>
        <div style={{
          fontSize: 11, fontFamily: 'inherit',
          color: '#8A7AB0', lineHeight: 1.5,
        }}>
          O fenômeno de crossing-over pode alterar os resultados.
          Abaixo estão listados os resultados normais e os possíveis
          resultados por crossing-over.
        </div>
      </div>

      {/* Normal results */}
      <div style={{
        fontSize: 12, fontFamily: "'DM Serif Display', serif",
        color: '#8BC34A', marginBottom: 10, letterSpacing: '0.05em',
      }}>
        Resultado Normal
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <ResultSection title="Filhotes Machos" icon="♂" results={crossing.resultadoNormal.machos} />
        <ResultSection title="Filhotes Fêmeas" icon="♀" results={crossing.resultadoNormal.femeas} />
      </div>

      {/* Crossing-over results */}
      <div style={{
        fontSize: 12, fontFamily: "'DM Serif Display', serif",
        color: '#FF9800', marginBottom: 10, letterSpacing: '0.05em',
      }}>
        Resultado por Crossing-Over
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
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
    <div className="page-block" style={{ color: 'var(--text-main)' }}>
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

      {/* ── Main layout: left selectors + right results ── */}
      <div style={{
        display: 'flex', gap: 30, flexWrap: 'wrap', alignItems: 'flex-start',
      }}>
        {/* ── LEFT: Selectors ── */}
        <div className="module-panel" style={{
          width: 360, flexShrink: 0,
          padding: '24px 22px',
        }}>
          <div style={{
            fontSize: 14, fontFamily: "'DM Serif Display', serif",
            color: '#C95025', marginBottom: 20,
          }}>
            Parâmetros do Cruzamento
          </div>

          {/* Espécie */}
          <CustomSelect
            label="Espécie"
            value={especie}
            onChange={handleEspecieChange}
            options={SPECIES}
            placeholder="Selecione a espécie..."
          />

          {/* Mutação do Macho */}
          <CustomSelect
            label="Mutação do Macho"
            value={mutacaoMacho}
            onChange={handleMachoChange}
            options={machoOptions}
            placeholder="Selecione a mutação do macho..."
            disabled={!especie}
          />
          {mutacaoMacho && <LegendText name={mutacaoMacho} />}

          {/* Mutação da Fêmea */}
          <CustomSelect
            label="Mutação da Fêmea"
            value={mutacaoFemea}
            onChange={setMutacaoFemea}
            options={femeaOptions}
            placeholder="Selecione a mutação da fêmea..."
            disabled={!mutacaoMacho}
          />
          {mutacaoFemea && <LegendText name={mutacaoFemea} />}

          {/* Summary cards */}
          {allSelected && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <StatCard
                label="Cruzamento"
                value={`${mutacaoMacho.length > 14 ? mutacaoMacho.slice(0, 12) + '...' : mutacaoMacho}`}
                desc={`× ${mutacaoFemea}`}
                color="#C95025"
              />
              {crossing && crossing.isCrossingOver && (
                <StatCard
                  label="Tipo"
                  value="Crossing-Over"
                  desc="Sem percentuais definidos"
                  color="#B39DDB"
                />
              )}
              {crossing && crossing.sexIndependent && (
                <StatCard
                  label="Herança"
                  value="Autossômica"
                  desc="Dominante — independe do sexo"
                  color="#EF9A9A"
                />
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Results ── */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {!allSelected ? (
            /* Instruction text when nothing selected */
            <div className="module-panel" style={{
              borderStyle: 'dashed', padding: '60px 40px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🧬</div>
              <div style={{
                fontSize: 15, fontFamily: "'DM Serif Display', serif",
                color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto',
              }}>
                Selecione a espécie e mutações do macho e fêmea para o resultado
                das possibilidades das mutações no nascimento dos filhotes
              </div>
              <div style={{
                fontSize: 11, fontFamily: 'inherit',
                color: '#3A5A3C', marginTop: 16,
              }}>
                Fonte: TARIM - Acasalamentos entre mutações (Décio Junior)
              </div>
            </div>
          ) : crossing.isCrossingOver ? (
            /* Crossing-over results */
            <div className="module-panel" style={{ padding: '22px 24px' }}>
              <div style={{
                fontSize: 18, fontFamily: "'DM Serif Display', serif",
                color: 'var(--text-main)', marginBottom: 4,
              }}>
                Resultado do Cruzamento
              </div>
              <div style={{
                fontSize: 12, fontFamily: 'inherit',
                color: 'var(--text-muted)', marginBottom: 18,
              }}>
                {mutacaoMacho} × {mutacaoFemea}
              </div>
              <CrossingOverResult crossing={crossing} />
            </div>
          ) : (
            /* Normal results */
            <div className="module-panel" style={{ padding: '22px 24px' }}>
              <div style={{
                fontSize: 18, fontFamily: "'DM Serif Display', serif",
                color: 'var(--text-main)', marginBottom: 4,
              }}>
                Resultado do Cruzamento
              </div>
              <div style={{
                fontSize: 12, fontFamily: 'inherit',
                color: 'var(--text-muted)', marginBottom: 18,
              }}>
                {mutacaoMacho} × {mutacaoFemea}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <ResultSection
                  title="Filhotes Machos"
                  icon="♂"
                  results={crossing.resultadoMachos}
                />
                <ResultSection
                  title="Filhotes Fêmeas"
                  icon="♀"
                  results={crossing.resultadoFemeas}
                />
              </div>

              {/* Sex-independent note for Diluição */}
              {crossing.sexIndependent && (
                <div style={{
                  background: 'rgba(239,154,154,0.08)', border: '1px solid rgba(239,154,154,0.2)',
                  borderRadius: 10, padding: '12px 16px', marginTop: 16,
                }}>
                  <div style={{
                    fontSize: 11, fontFamily: 'inherit',
                    color: '#EF9A9A', lineHeight: 1.5,
                  }}>
                    Herança autossômica dominante — os resultados são idênticos
                    para filhotes machos e fêmeas.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="module-panel" style={{ marginTop: 26, padding: '22px 24px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontFamily: 'inherit', color: '#C95025',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
            }}>
              Cadastro de mutações
            </div>
            <div style={{
              fontSize: 22, fontFamily: "'DM Serif Display', serif", color: 'var(--text-main)', marginBottom: 6,
            }}>
              Nova mutação
            </div>
            <div style={{
              fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7, maxWidth: 720,
            }}>
              Cadastre mutações por espécie para alimentar o restante do sistema. Essas mutações passam a ficar disponíveis no cadastro da ave quando a espécie correspondente for selecionada.
            </div>
            {!canManageMutations ? (
              <div style={{
                marginTop: 10,
                fontSize: 12,
                color: '#d8b7a8',
                lineHeight: 1.7,
              }}>
                O cadastro de mutação fica disponível apenas na sua conta master.
              </div>
            ) : null}
          </div>

          <div style={{ minWidth: 160 }}>
            <StatCard
              label="Cadastradas"
              value={mutationRecords.length}
              desc="regras registradas"
              color="#C95025"
            />
          </div>
        </div>

        {mutationError ? (
          <div style={{
            background: 'rgba(224,92,75,0.12)', border: '1px solid rgba(224,92,75,0.28)', borderRadius: 10,
            padding: '12px 14px', color: '#ffc9c1', fontSize: 12, marginBottom: 14,
          }}>
            {mutationError}
          </div>
        ) : null}

        {mutationMessage ? (
          <div style={{
            background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.28)', borderRadius: 10,
            padding: '12px 14px', color: '#d6f5e6', fontSize: 12, marginBottom: 14,
          }}>
            {mutationMessage}
          </div>
        ) : null}

        {canManageMutations ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <CustomSelect
                label="Espécie"
                value={mutationForm.Especie}
                onChange={(value) => setMutationField('Especie', value)}
                options={mutationSpeciesOptions}
                placeholder="Selecione a espécie..."
              />

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Mutação macho
                </label>
                <input value={mutationForm.MutacaoMacho} onChange={(e) => setMutationField('MutacaoMacho', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Legenda macho
                </label>
                <input value={mutationForm.LegendaMutacaoMacho} onChange={(e) => setMutationField('LegendaMutacaoMacho', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Mutação fêmea
                </label>
                <input value={mutationForm.MutacaoFemea} onChange={(e) => setMutationField('MutacaoFemea', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Legenda fêmea
                </label>
                <input value={mutationForm.LegendaMutacaoFemea} onChange={(e) => setMutationField('LegendaMutacaoFemea', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Filhote macho
                </label>
                <input value={mutationForm.MutacaoFilhoteMacho} onChange={(e) => setMutationField('MutacaoFilhoteMacho', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Legenda filhote macho
                </label>
                <input value={mutationForm.LegendaFilhoteMacho} onChange={(e) => setMutationField('LegendaFilhoteMacho', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Filhote fêmea
                </label>
                <input value={mutationForm.MutacaoFilhoteFemea} onChange={(e) => setMutationField('MutacaoFilhoteFemea', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontFamily: 'inherit',
                  color: '#C95025', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Legenda filhote fêmea
                </label>
                <input value={mutationForm.LegendaFilhoteFemea} onChange={(e) => setMutationField('LegendaFilhoteFemea', e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid rgba(201,80,37,0.3)', borderRadius: 8, outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCreateMutation}
                disabled={mutationSaving}
                style={{
                  border: 'none', borderRadius: 10, padding: '12px 18px',
                  background: 'linear-gradient(135deg, #C95025, #A0401D)', color: '#fff7f2',
                  fontFamily: 'inherit', cursor: mutationSaving ? 'not-allowed' : 'pointer',
                  opacity: mutationSaving ? 0.7 : 1,
                }}
              >
                {mutationSaving ? 'Salvando...' : 'Cadastrar mutação'}
              </button>
            </div>
          </>
        ) : null}

        <div style={{ marginTop: 24 }}>
          <div style={{
            fontSize: 13, fontFamily: "'DM Serif Display', serif", color: 'var(--text-main)', marginBottom: 12,
          }}>
            Últimas mutações cadastradas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {recentMutations.map((item) => (
              <div key={item.ID} style={{
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: 11, fontFamily: 'inherit', color: '#C95025', marginBottom: 8 }}>
                  {item.Especie}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.7 }}>
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
  )
}
