#!/usr/bin/env node
/**
 * Reseta um scheduled_post de status='failed' (ou qualquer outro) de volta para 'pending',
 * zerando retry_count e error_message. Util quando credenciais mudaram e falhas antigas
 * precisam ser retentadas pelo sweep.
 *
 * Uso:
 *   cd backend
 *   node scripts/retry-scheduled-post.js Post2
 *   node scripts/retry-scheduled-post.js Post2 Post3 Post4   # multiplos
 *   node scripts/retry-scheduled-post.js --all-failed         # reseta todos failed
 */
'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.secrets'), override: false })
require('dotenv').config()

const { Pool } = require('pg')

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Uso: node scripts/retry-scheduled-post.js <externalKey1> [externalKey2 ...] | --all-failed')
    process.exit(1)
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('ERRO: DATABASE_URL vazio')
    process.exit(1)
  }

  const ssl = String(process.env.DATABASE_SSL || 'true').trim().toLowerCase() === 'false'
    ? false
    : { rejectUnauthorized: false }

  const pool = new Pool({ connectionString: url, ssl })

  try {
    let result
    if (args[0] === '--all-failed') {
      result = await pool.query(
        `UPDATE scheduled_posts
           SET status='pending', error_message=NULL, retry_count=0, updated_at=NOW()
         WHERE status='failed'
         RETURNING id, external_key, scheduled_for`
      )
    } else {
      result = await pool.query(
        `UPDATE scheduled_posts
           SET status='pending', error_message=NULL, retry_count=0, updated_at=NOW()
         WHERE external_key = ANY($1::text[])
         RETURNING id, external_key, scheduled_for, status`,
        [args]
      )
    }

    console.log(`OK - ${result.rowCount} post(s) resetado(s) para pending:`)
    for (const row of result.rows) {
      console.log(`  ${row.external_key} @ ${row.scheduled_for.toISOString()}`)
    }
    if (result.rowCount === 0) {
      console.log('  (nenhum post correspondeu ao filtro)')
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('ERRO:', err)
  process.exit(1)
})
