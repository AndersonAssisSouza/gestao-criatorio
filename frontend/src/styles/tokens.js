// ─── DESIGN TOKENS — GESTÃO CRIATÓRIO ─────────────────────────────────────
// Baseado no Power Apps original
// Cor principal: Laranja Queimado (varCorPrincipal do Power Apps)

export const colors = {
  // Backgrounds
  bgPrincipal:    '#0A1A0C',
  bgSuperficie:   '#0D1A10',
  bgCard:         '#152818',
  bgCardHover:    'rgba(201,80,37,0.04)',

  // Primária (Power Apps: varCorPrincipal = RGBA(201,80,37,1))
  principal:      '#C95025',
  principalTrans: 'rgba(201,80,37,0.3)',
  principalFundo: 'rgba(201,80,37,0.1)',
  principalBorda: 'rgba(201,80,37,0.2)',

  // Compatibilidade
  ambar:          '#C95025',
  ambarSombra:    '#A0401D',
  ambarFundo:     'rgba(201,80,37,0.1)',
  ambarBorda:     'rgba(201,80,37,0.2)',

  // Componente (Power Apps: varCorComponente = RGBA(102,101,101,1))
  componente:     '#666565',
  componenteTrans:'rgba(102,101,101,0.3)',

  // Status
  ativo:          '#4CAF7D',
  ativoBg:        'rgba(76,175,125,0.12)',
  chocando:       '#F5A623',
  chocandoBg:     'rgba(245,166,35,0.12)',
  inativo:        '#8A9E8C',
  inativoBg:      'rgba(138,158,140,0.12)',

  // Texto
  textoPrimario:  '#F2EDE4',
  textoSecundario:'#D8E8D8',
  textoTerciario: '#8A9E8C',
  textoQuaternario:'#5A7A5C',
  textoMuted:     '#4A6A4C',
  textoDisabled:  '#3A5C3C',

  // Bordas
  borda:          'rgba(255,255,255,0.07)',
  bordaSutil:     'rgba(255,255,255,0.04)',

  // Ação destrutiva
  erro:           '#E05C4B',
  erroBg:         'rgba(224,92,75,0.08)',
  erroBorda:      'rgba(224,92,75,0.15)',

  // Utilitários
  branco:         '#FFFFFF',
  preto:          '#000000',
};

export const fonts = {
  display: "'DM Serif Display', 'Georgia', serif",
  mono:    "'DM Mono', 'Courier New', monospace",
};

export const radius = {
  sm:  6,
  md:  8,
  lg:  12,
  xl:  16,
};

// Status do Plantel (Power Apps: Dropdown4_6 Items)
// "Vivo", "Filhote", "Falecimento", "Vendido", "Doado"
// Status de Gaiolas (Power Apps: Dropdown4_12 Items)
// "Chocando", "Vazia", "Preparacao", "Dividida", "Com Ave Avulsa", "Com Duas Aves Separadas", "Acasalando"
// Status de Ovos: "Postura", "Chocando", "Fertilizado", "Nasceu", "Descartado"
// Status de Filhotes: "Vivo", "Faleceu", "Plantel"

export const STATUS_CONFIG = {
  // ── Plantel ──
  'Vivo':         { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)',  dot: '#4CAF7D' },
  'Filhote':      { color: '#5BC0EB', bg: 'rgba(91,192,235,0.12)',  dot: '#5BC0EB' },
  'Falecimento':  { color: '#E05C4B', bg: 'rgba(224,92,75,0.12)',   dot: '#E05C4B' },
  'Vendido':      { color: '#C95025', bg: 'rgba(201,80,37,0.12)',   dot: '#C95025' },
  'Doado':        { color: '#9B8EC4', bg: 'rgba(155,142,196,0.12)', dot: '#9B8EC4' },

  // ── Gaiolas ──
  'Chocando':               { color: '#F5A623', bg: 'rgba(245,166,35,0.12)',  dot: '#F5A623' },
  'Vazia':                  { color: '#8A9E8C', bg: 'rgba(138,158,140,0.12)', dot: '#8A9E8C' },
  'Preparacao':             { color: '#5BC0EB', bg: 'rgba(91,192,235,0.12)',  dot: '#5BC0EB' },
  'Dividida':               { color: '#9B8EC4', bg: 'rgba(155,142,196,0.12)', dot: '#9B8EC4' },
  'Com Ave Avulsa':         { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },
  'Com Duas Aves Separadas':{ color: '#C95025', bg: 'rgba(201,80,37,0.12)',  dot: '#C95025' },
  'Acasalando':             { color: '#E88DB4', bg: 'rgba(232,141,180,0.12)', dot: '#E88DB4' },

  // ── Ovos ──
  'Postura':      { color: '#5BC0EB', bg: 'rgba(91,192,235,0.12)',  dot: '#5BC0EB' },
  'Fertilizado':  { color: '#F5A623', bg: 'rgba(245,166,35,0.12)',  dot: '#F5A623' },
  'Nasceu':       { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },
  'Descartado':   { color: '#E05C4B', bg: 'rgba(224,92,75,0.12)',  dot: '#E05C4B' },

  // ── Filhotes ──
  'Faleceu':      { color: '#E05C4B', bg: 'rgba(224,92,75,0.12)',  dot: '#E05C4B' },
  'Plantel':      { color: '#C95025', bg: 'rgba(201,80,37,0.12)',  dot: '#C95025' },

  // ── Anéis ──
  'Utilizado':    { color: '#F5A623', bg: 'rgba(245,166,35,0.12)',  dot: '#F5A623' },
  'Disponível':   { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },

  // ── Genéricos ──
  'Ativo':        { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },
  'Inativo':      { color: '#8A9E8C', bg: 'rgba(138,158,140,0.12)', dot: '#8A9E8C' },
};
