#!/usr/bin/env node
/**
 * Reseta a senha do owner direto no Neon Postgres (tabela app_state, collection_name='users').
 * Usado quando a rotacao do OWNER_PASSWORD no .env + Worker nao re-hasha no banco via ensureOwnerUser.
 *
 * Le OWNER_EMAIL, OWNER_PASSWORD, OWNER_NAME, OWNER_ACCESS_KEY, DATABASE_URL de .env.secrets.
 *
 * Uso:
 *   cd backend
 *   node scripts/reset-owner-password.js
 */
'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.secrets'), override: false })
require('dotenv').config()

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { Pool } = require('pg')

async function main() {
  const email = String(process.env.OWNER_EMAIL || '').trim().toLowerCase()
  const password = process.env.OWNER_PASSWORD
  const name = process.env.OWNER_NAME || 'Anderson Assis'
  const accessKey = process.env.OWNER_ACCESS_KEY || 'anderson'
  const databaseUrl = process.env.DATABASE_URL

  if (!email || !password) {
    console.error('ERRO: OWNER_EMAIL ou OWNER_PASSWORD vazios no .env.secrets')
    process.exit(1)
  }
  if (!databaseUrl) {
    console.error('ERRO: DATABASE_URL vazio no .env.secrets')
    process.exit(1)
  }

  console.log(`Reset owner: ${email}`)

  const hash = await bcrypt.hash(password, 12)

  const ssl = String(process.env.DATABASE_SSL || 'true').trim().toLowerCase() === 'false'
    ? false
    : { rejectUnauthorized: false }

  const pool = new Pool({ connectionString: databaseUrl, ssl })

  try {
    const { rows } = await pool.query(
      `SELECT data FROM app_state WHERE collection_name = $1 LIMIT 1`,
      ['users']
    )
    let users = Array.isArray(rows[0]?.data) ? rows[0].data : []
    console.log(`Total users atuais no banco: ${users.length}`)

    const idx = users.findIndex((u) => String(u.email).toLowerCase() === email)
    const now = new Date().toISOString()

    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        name,
        email,
        passwordHash: hash,
        role: 'owner',
        accessKey,
        isLifetimeOwner: true,
        updatedAt: now,
      }
      console.log(`Usuario existente atualizado: id=${users[idx].id}`)
    } else {
      users.push({
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash: hash,
        role: 'owner',
        accessKey,
        createdAt: now,
        updatedAt: now,
        isLifetimeOwner: true,
      })
      console.log(`Usuario criado novo: email=${email}`)
    }

    await pool.query(
      `INSERT INTO app_state (collection_name, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (collection_name) DO UPDATE
         SET data = EXCLUDED.data, updated_at = NOW()`,
      ['users', JSON.stringify(users)]
    )

    console.log(`OK - senha do owner resetada no banco. Total users: ${users.length}`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('ERRO:', err)
  process.exit(1)
})
