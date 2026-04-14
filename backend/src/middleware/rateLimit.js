const rateLimit = require('express-rate-limit')

// Limite de tentativas de login: 5 por minuto por IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      5,
  message:  { message: 'Muitas tentativas de login. Aguarde 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Muitas tentativas de cadastro. Aguarde alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Limite geral de API: 100 req/min por IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      100,
  message:  { message: 'Limite de requisições atingido.' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { apiLimiter, loginLimiter, registerLimiter }
