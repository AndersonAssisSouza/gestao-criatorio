#!/usr/bin/env node
/**
 * Roda uma migration SQL contra o DATABASE_URL (Neon).
 *
 * Uso:
 *   cd backend
 *   DATABASE_URL="postgresql://..." node scripts/run-migration.js migrations/001_scheduled_posts.sql
 *
 * Ou com .env.secrets já setado:
 *   set -a; source .env.secrets; set +a
 *   node scripts/run-migration.js migrations/001_scheduled_posts.sql
 */
'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.secrets'), override: false })
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('ERRO: passe o caminho da migration. Ex: node scripts/run-migration.js migrations/001_scheduled_posts.sql')
    process.exit(1)
  }

  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  if (!fs.existsSync(abs)) {
    console.error(`ERRO: arquivo não existe: ${abs}`)
    process.exit(1)
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('ERRO: DATABASE_URL não definido no ambiente')
    process.exit(1)
  }

  const sql = neon(url)
  const statements = fs.readFileSync(abs, 'utf8')
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s && !/^--/.test(s))

  console.log(`Executando ${statements.length} statements de ${filePath}...`)
  for (const stmt of statements) {
    const preview = stmt.substring(0, 80).replace(/\s+/g, ' ')
    process.stdout.write(`  → ${preview}...`)
    try {
      // neon() retorna função tagged template; usa .query pra SQL arbitrário
      await sql.query(stmt)
      console.log(' OK')
    } catch (err) {
      console.log(' FAIL')
      console.error(`     ${err.message}`)
      process.exit(1)
    }
  }

  console.log('\nMigration concluída.')
}

main().catch((err) => {
  console.error('ERRO:', err)
  process.exit(1)
})
