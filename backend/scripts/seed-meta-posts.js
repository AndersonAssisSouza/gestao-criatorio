#!/usr/bin/env node
/**
 * Seed dos 11 posts do calendário de marketing.
 * Lê os .md de Marketing/posts_publicar/ e enfileira via repository
 * (upsert por external_key para ser idempotente).
 *
 * Uso (com DATABASE_URL no env):
 *   cd backend
 *   set -a; source .env.secrets; set +a
 *   node scripts/seed-meta-posts.js
 *
 * Flags:
 *   --dry-run   — mostra o que faria sem gravar
 *   --only=2,3  — apenas posts especificados
 */
'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.secrets'), override: false })
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const repo = require('../src/repositories/scheduled-posts.repository')

const BASE_URL = 'https://plumar.com.br/marketing'
const POSTS_DIR = path.join(__dirname, '..', '..', 'Marketing', 'posts_publicar')

/**
 * Mapa dos 11 posts baseado no cronograma confirmado (em publication_queue.csv).
 * Captura quais mídias compõem cada post (singular ou array).
 */
const PLAN = {
  2:  { type: 'reel',     media: ['PLUMAR_Post2_Reel_5Problemas.mp4'],     when: '2026-04-17T07:30-03:00', platforms: ['facebook', 'instagram'] },
  3:  { type: 'carousel', media: Array.from({ length: 7 }, (_, i) => `PLUMAR_Post3_Slide${i+1}.png`), when: '2026-04-19T11:00-03:00', platforms: ['facebook', 'instagram'] },
  4:  { type: 'story',    media: ['PLUMAR_Post4_Story1.png', 'PLUMAR_Post4_Story2.png', 'PLUMAR_Post4_Story3.png'], when: '2026-04-20T19:00-03:00', platforms: ['instagram'] },
  6:  { type: 'reel',     media: ['PLUMAR_Post6_Reel_Simulador.mp4'],       when: '2026-04-22T19:30-03:00', platforms: ['facebook', 'instagram'] },
  7:  { type: 'carousel', media: Array.from({ length: 6 }, (_, i) => `PLUMAR_Post7_Slide${i+1}.png`), when: '2026-04-24T12:30-03:00', platforms: ['facebook', 'instagram'] },
  9:  { type: 'carousel', media: Array.from({ length: 8 }, (_, i) => `PLUMAR_Post9_Slide${i+1}.png`), when: '2026-04-26T11:00-03:00', platforms: ['facebook', 'instagram'] },
  10: { type: 'reel',     media: ['PLUMAR_Post10_Reel_3Funcionalidades.mp4'], when: '2026-04-28T19:00-03:00', platforms: ['facebook', 'instagram'] },
  11: { type: 'image',    media: ['PLUMAR_Post11_DicaManejo.png'],           when: '2026-04-30T08:00-03:00', platforms: ['facebook', 'instagram'] },
  12: { type: 'carousel', media: Array.from({ length: 7 }, (_, i) => `PLUMAR_Post12_Slide${i+1}.png`), when: '2026-05-02T11:00-03:00', platforms: ['facebook', 'instagram'] },
  // Post 13 originalmente planejado como Reel de depoimento em vídeo, mas a
  // mídia disponível é um PNG. Tratamos como image para não quebrar a
  // publicação automática; quando o vídeo real for produzido, trocar
  // type:'reel' e media para o .mp4 e reaplicar o seed (upsert por external_key).
  13: { type: 'image',    media: ['PLUMAR_Post13_Depoimento.png'],           when: '2026-05-04T19:30-03:00', platforms: ['facebook', 'instagram'] },
  14: { type: 'image',    media: ['PLUMAR_Post14_Urgencia.png'],             when: '2026-05-06T20:00-03:00', platforms: ['facebook', 'instagram'] },
}

function parsePostMd(num) {
  const file = path.join(POSTS_DIR, `post_${String(num).padStart(2, '0')}.md`)
  if (!fs.existsSync(file)) return null
  const content = fs.readFileSync(file, 'utf8')
  // Extrai caption entre "## Caption..." e próximo "##"
  const captionMatch = content.match(/## Caption[^\n]*\n+([\s\S]+?)(?=\n## |\n$)/i)
  const caption = captionMatch ? captionMatch[1].trim() : ''
  // Extrai hashtags da caption se presentes
  const lines = caption.split('\n').map((l) => l.trim()).filter(Boolean)
  const hashLine = lines.reverse().find((l) => l.startsWith('#')) || ''
  // Título na primeira linha do arquivo
  const titleMatch = content.match(/^#\s+(.+?)$/m)
  const title = titleMatch ? titleMatch[1].trim() : `Post ${num}`
  return { title, caption, hashtags: hashLine }
}

function parseArgs() {
  const args = {}
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true
    else if (a.startsWith('--only=')) args.only = a.slice(7).split(',').map((n) => parseInt(n, 10)).filter(Boolean)
  }
  return args
}

async function main() {
  const args = parseArgs()
  const nums = args.only || Object.keys(PLAN).map(Number)
  console.log(`Seeding ${nums.length} posts ${args.dryRun ? '(DRY RUN)' : ''}`)

  for (const num of nums) {
    const plan = PLAN[num]
    if (!plan) {
      console.log(`  [skip] Post ${num} — não está no plano`)
      continue
    }
    const md = parsePostMd(num)
    if (!md) {
      console.log(`  [skip] Post ${num} — post_${String(num).padStart(2, '0')}.md não encontrado`)
      continue
    }

    const row = {
      externalKey: `Post${num}`,
      title: md.title,
      caption: md.caption,
      hashtags: md.hashtags,
      mediaUrls: plan.media.map((m) => `${BASE_URL}/${m}`),
      mediaType: plan.type,
      platforms: plan.platforms,
      scheduledFor: new Date(plan.when).toISOString(),
    }

    console.log(`  Post ${num} → ${row.mediaType} @ ${row.scheduledFor} → ${row.platforms.join(',')}`)
    console.log(`    media (${row.mediaUrls.length}): ${row.mediaUrls[0]}${row.mediaUrls.length > 1 ? ` … +${row.mediaUrls.length - 1}` : ''}`)

    if (args.dryRun) continue

    try {
      const saved = await repo.upsertByExternalKey(row)
      console.log(`    ✓ id=${saved.id} status=${saved.status}`)
    } catch (err) {
      console.error(`    ✗ erro: ${err.message}`)
    }
  }

  if (!args.dryRun) {
    const all = await repo.listAll({ limit: 50 })
    console.log(`\nTotal no banco: ${all.length}`)
    for (const p of all) {
      console.log(`  ${p.externalKey || '(sem key)'} ${p.status.padEnd(10)} ${p.scheduledFor.toISOString?.() || p.scheduledFor}`)
    }
  }
}

main().catch((err) => {
  console.error('ERRO:', err)
  process.exit(1)
})
