#!/usr/bin/env node
/**
 * Reseta rows de scheduled_posts com status='failed' (ou --all) para 'pending',
 * limpando error_message e last_attempt_at para o cron reprocessar.
 *
 * Uso:
 *   cd backend
 *   node scripts/reset-failed-to-pending.js                # apenas failed
 *   node scripts/reset-failed-to-pending.js --all          # failed + publishing (travados)
 *   node scripts/reset-failed-to-pending.js --only=Post2   # por external_key
 */
'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.secrets'), override: false })
require('dotenv').config()

const { neon } = require('@neondatabase/serverless')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('ERRO: DATABASE_URL não definido')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const includeAll = args.includes('--all')
  const onlyArg = args.find((a) => a.startsWith('--only='))
  const onlyKeys = onlyArg ? onlyArg.slice(7).split(',') : null

  const sql = neon(url)

  let statusFilter
  if (onlyKeys) {
    // filtro por external_key; status ignorado
    const rows = await sql`
      UPDATE scheduled_posts
      SET status = 'pending', error_message = NULL, last_attempt_at = NULL, retry_count = 0
      WHERE external_key = ANY(${onlyKeys})
      RETURNING id, external_key, status
    `
    console.log(`Resetados por external_key (${onlyKeys.join(',')}): ${rows.length}`)
    for (const r of rows) console.log(`  ${r.external_key} → ${r.status}`)
    return
  }

  statusFilter = includeAll ? ['failed', 'publishing'] : ['failed']
  const rows = await sql`
    UPDATE scheduled_posts
    SET status = 'pending', error_message = NULL, last_attempt_at = NULL, retry_count = 0
    WHERE status = ANY(${statusFilter})
    RETURNING id, external_key, status
  `
  console.log(`Resetados (${statusFilter.join(',')}): ${rows.length}`)
  for (const r of rows) console.log(`  ${r.external_key || r.id} → ${r.status}`)
}

main().catch((err) => {
  console.error('ERRO:', err)
  process.exit(1)
})
