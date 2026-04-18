// Configuração padrão do programa de indicações (cupons) PLUMAR

// Tiers de captador: percentuais aplicados em novos cupons por padrão
const CUPOM_TIERS = {
  bronze: {
    label: 'Bronze',
    descontoPercentual: 15,        // desconto para o cliente (1ª compra)
    comissaoPercentual: 20,        // % do valor líquido creditado para o captador
    comissaoDuracaoMeses: 12,      // duração da comissão recorrente
    minIndicacoes: 0,
  },
  prata: {
    label: 'Prata',
    descontoPercentual: 20,
    comissaoPercentual: 25,
    comissaoDuracaoMeses: 12,
    minIndicacoes: 5,
  },
  ouro: {
    label: 'Ouro',
    descontoPercentual: 25,
    comissaoPercentual: 30,
    comissaoDuracaoMeses: 18,
    minIndicacoes: 20,
  },
}

// Regras financeiras
const CUPOM_RULES = {
  saqueMinimo: 50,                 // R$ mínimo para solicitar payout
  diasCarenciaCredito: 7,          // dias até crédito virar sacável (CDC)
  diasJanelaAtribuicao: 30,        // janela entre clique e cadastro
  codigoMinLength: 4,
  codigoMaxLength: 20,
  descontoPercentualMaximo: 50,    // teto de segurança
  comissaoPercentualMaximo: 60,
}

// Regex para validar códigos (alfanumérico + hífen, sem espaços)
const CUPOM_CODIGO_REGEX = /^[A-Z0-9_-]+$/

module.exports = {
  CUPOM_TIERS,
  CUPOM_RULES,
  CUPOM_CODIGO_REGEX,
}
