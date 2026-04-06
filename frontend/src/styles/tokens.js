// ─── DESIGN TOKENS — GESTÃO CRIATÓRIO ─────────────────────────────────────
// Conceito: Natural Precision
// Paleta: Verde Floresta + Âmbar Dourado

export const colors = {
  // Backgrounds
  bgPrincipal:    '#0A1A0C',
  bgSuperficie:   '#0D1A10',
  bgCard:         '#152818',
  bgCardHover:    'rgba(212,160,23,0.04)',

  // Primária
  ambar:          '#D4A017',
  ambarSombra:    '#B8870F',
  ambarFundo:     'rgba(212,160,23,0.1)',
  ambarBorda:     'rgba(212,160,23,0.2)',

  // Status
  ativo:          '#4CAF7D',
  ativoBg:        'rgba(76,175,125,0.12)',
  chocando:       '#F5A623',
  chocandoBg:     'rgba(212,160,23,0.12)',
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

export const STATUS_CONFIG = {
  'Ativo':       { color: colors.ativo,    bg: colors.ativoBg,    dot: colors.ativo },
  'Chocando':    { color: colors.chocando, bg: colors.chocandoBg, dot: colors.chocando },
  'Inativo':     { color: colors.inativo,  bg: colors.inativoBg,  dot: colors.inativo },
  'Disponível':  { color: colors.ativo,    bg: colors.ativoBg,    dot: colors.ativo },
  'Ocupada':     { color: colors.chocando, bg: colors.chocandoBg, dot: colors.chocando },
  'Manutenção':  { color: colors.inativo,  bg: colors.inativoBg,  dot: colors.inativo },
  // Choco
  'Em Choco':                 { color: '#F5A623', bg: 'rgba(245,166,35,0.12)',  dot: '#F5A623' },
  'Eclodido':                 { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },
  'Abandonado':               { color: '#E05C4B', bg: 'rgba(224,92,75,0.10)',  dot: '#E05C4B' },
  // Filhotes
  'Em Desenvolvimento':       { color: '#5BC0EB', bg: 'rgba(91,192,235,0.12)',  dot: '#5BC0EB' },
  'Desmamado':                { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)',  dot: '#4CAF7D' },
  'Transferido para Plantel': { color: '#D4A017', bg: 'rgba(212,160,23,0.12)',  dot: '#D4A017' },
  'Óbito':                    { color: '#E05C4B', bg: 'rgba(224,92,75,0.12)',   dot: '#E05C4B' },
  // Espécies — Conservação
  'Comum':                    { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },
  'Quase Ameaçada':           { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', dot: '#F5A623' },
  'Vulnerável':               { color: '#E05C4B', bg: 'rgba(224,92,75,0.12)',  dot: '#E05C4B' },
  // Aviário
  'Reforma':                  { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', dot: '#F5A623' },
  // Anéis
  'Utilizado':                { color: '#5BC0EB', bg: 'rgba(91,192,235,0.12)',  dot: '#5BC0EB' },
  'Extraviado':               { color: '#E05C4B', bg: 'rgba(224,92,75,0.12)',   dot: '#E05C4B' },
  // Financeiro
  'Pago':                     { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },
  'Pendente':                 { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', dot: '#F5A623' },
  'Cancelado':                { color: '#E05C4B', bg: 'rgba(224,92,75,0.12)',  dot: '#E05C4B' },
  // Ex-Plantel — Motivo Saída
  'Venda':                    { color: '#D4A017', bg: 'rgba(212,160,23,0.12)', dot: '#D4A017' },
  'Doação':                   { color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)', dot: '#4CAF7D' },
  'Fuga':                     { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', dot: '#F5A623' },
  'Outro':                    { color: '#8A9E8C', bg: 'rgba(138,158,140,0.12)', dot: '#8A9E8C' },
};
