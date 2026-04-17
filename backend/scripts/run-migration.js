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
  // 1) Remove comentários "--" linha-a-linha ANTES do split (senão blocos que
  //    começam com comentário são descartados junto com o statement seguinte).
  // 2) Divide em statements respeitando blocos $$ ... $$ (funções PL/pgSQL
  //    têm ";" internos que NÃO devem quebrar o statement).
  const raw = fs.readFileSync(abs, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n')

  const statements = []
  let buf = ''
  let inDollar = false
  for (let i = 0; i < raw.length; i++) {
    const two = raw.substr(i, 2)
    if (two === '$$') {
      inDollar = !inDollar
      buf += two
      i++
      continue
    }
    const ch = raw[i]
    if (ch === ';' && !inDollar) {
      const trimmed = buf.trim()
      if (trimmed) statements.push(trimmed)
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim()) statements.push(buf.trim())

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
