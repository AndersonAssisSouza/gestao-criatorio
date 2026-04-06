const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')

// ─── ATENÇÃO ──────────────────────────────────────────────────────────────────
// Este controller usa um array em memória como banco de usuários temporário.
// Para produção, substitua pelos métodos do Supabase ou outro banco.
// Ver documentação: GestaoMiniatorio_DOC_TEC.docx seção 11
// ─────────────────────────────────────────────────────────────────────────────
const users = [] // TODO: substituir por Supabase client

function gerarToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 8 caracteres.' })
    }

    const exists = users.find(u => u.email === email)
    if (exists) {
      return res.status(409).json({ message: 'E-mail já cadastrado.' })
    }

    const hash = await bcrypt.hash(password, 12)
    const user = { id: Date.now().toString(), name, email, password: hash, role: 'user', createdAt: new Date() }
    users.push(user)

    const token = gerarToken(user)
    const { password: _, ...safeUser } = user

    res.status(201).json({ token, user: safeUser })
  } catch (e) {
    console.error('[auth/register]', e)
    res.status(500).json({ message: 'Erro ao registrar usuário.' })
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' })
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const token = gerarToken(user)
    const { password: _, ...safeUser } = user

    res.json({ token, user: safeUser })
  } catch (e) {
    console.error('[auth/login]', e)
    res.status(500).json({ message: 'Erro ao fazer login.' })
  }
}

async function me(req, res) {
  try {
    const user = users.find(u => u.id === req.user.userId)
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' })
    const { password: _, ...safeUser } = user
    res.json({ user: safeUser })
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar usuário.' })
  }
}

module.exports = { register, login, me }
