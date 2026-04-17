/**
 * Repository para scheduled_posts — posts agendados para publicação
 * automática via Meta Graph API.
 */
'use strict'

const { neon } = require('@neondatabase/serverless')

let sqlInstance = null
function getSql() {
  if (!sqlInstance) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL não configurado')
    sqlInstance = neon(url)
  }
  return sqlInstance
}

const VALID_STATUSES = ['pending', 'publishing', 'published', 'failed', 'canceled']
const VALID_MEDIA_TYPES = ['image', 'carousel', 'video', 'reel', 'story']

function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    externalKey: row.external_key,
    title: row.title,
    caption: row.caption,
    hashtags: row.hashtags,
    mediaUrls: row.media_urls || [],
    mediaType: row.media_type,
    platforms: row.platforms || [],
    scheduledFor: row.scheduled_for,
    status: row.status,
    publishedIds: row.published_ids || null,
    errorMessage: row.error_message,
    retryCount: row.retry_count || 0,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function upsertByExternalKey(data) {
  const sql = getSql()
  if (!data.externalKey) throw new Error('externalKey é obrigatório para upsert')
  if (!VALID_MEDIA_TYPES.includes(data.mediaType)) {
    throw new Error(`mediaType inválido: ${data.mediaType}`)
  }
  const rows = await sql`
    INSERT INTO scheduled_posts
      (external_key, title, caption, hashtags, media_urls, media_type, platforms, scheduled_for, status)
    VALUES
      (${data.externalKey}, ${data.title}, ${data.caption}, ${data.hashtags || null},
       ${data.mediaUrls}, ${data.mediaType}, ${data.platforms}, ${data.scheduledFor}, ${data.status || 'pending'})
    ON CONFLICT (external_key) DO UPDATE SET
      title         = EXCLUDED.title,
      caption       = EXCLUDED.caption,
      hashtags      = EXCLUDED.hashtags,
      media_urls    = EXCLUDED.media_urls,
      media_type    = EXCLUDED.media_type,
      platforms     = EXCLUDED.platforms,
      scheduled_for = EXCLUDED.scheduled_for
    WHERE scheduled_posts.status NOT IN ('publishing', 'published')
    RETURNING *`
  return mapRow(rows[0])
}

async function create(data) {
  const sql = getSql()
  if (!VALID_MEDIA_TYPES.includes(data.mediaType)) {
    throw new Error(`mediaType inválido: ${data.mediaType}`)
  }
  const rows = await sql`
    INSERT INTO scheduled_posts
      (external_key, title, caption, hashtags, media_urls, media_type, platforms, scheduled_for, status)
    VALUES
      (${data.externalKey || null}, ${data.title}, ${data.caption}, ${data.hashtags || null},
       ${data.mediaUrls}, ${data.mediaType}, ${data.platforms}, ${data.scheduledFor}, ${data.status || 'pending'})
    RETURNING *`
  return mapRow(rows[0])
}

async function findById(id) {
  const sql = getSql()
  const rows = await sql`SELECT * FROM scheduled_posts WHERE id = ${id}`
  return mapRow(rows[0])
}

async function findByExternalKey(externalKey) {
  const sql = getSql()
  const rows = await sql`SELECT * FROM scheduled_posts WHERE external_key = ${externalKey}`
  return mapRow(rows[0])
}

async function findDuePending(limit = 10) {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM scheduled_posts
    WHERE status = 'pending' AND scheduled_for <= NOW()
    ORDER BY scheduled_for
    LIMIT ${limit}`
  return rows.map(mapRow)
}

async function listAll({ status = null, limit = 100 } = {}) {
  const sql = getSql()
  const rows = status
    ? await sql`SELECT * FROM scheduled_posts WHERE status = ${status} ORDER BY scheduled_for DESC LIMIT ${limit}`
    : await sql`SELECT * FROM scheduled_posts ORDER BY scheduled_for DESC LIMIT ${limit}`
  return rows.map(mapRow)
}

async function markPublishing(id) {
  const sql = getSql()
  const rows = await sql`
    UPDATE scheduled_posts
    SET status = 'publishing', last_attempt_at = NOW(), retry_count = retry_count + 1
    WHERE id = ${id} AND status = 'pending'
    RETURNING *`
  return mapRow(rows[0])
}

async function markPublished(id, publishedIds) {
  const sql = getSql()
  const rows = await sql`
    UPDATE scheduled_posts
    SET status = 'published', published_ids = ${JSON.stringify(publishedIds)}, error_message = NULL
    WHERE id = ${id}
    RETURNING *`
  return mapRow(rows[0])
}

async function markFailed(id, errorMessage) {
  const sql = getSql()
  const rows = await sql`
    UPDATE scheduled_posts
    SET status = CASE WHEN retry_count >= 3 THEN 'failed' ELSE 'pending' END,
        error_message = ${String(errorMessage || '').substring(0, 2000)}
    WHERE id = ${id}
    RETURNING *`
  return mapRow(rows[0])
}

async function cancel(id) {
  const sql = getSql()
  const rows = await sql`
    UPDATE scheduled_posts
    SET status = 'canceled'
    WHERE id = ${id} AND status IN ('pending', 'failed')
    RETURNING *`
  return mapRow(rows[0])
}

async function deleteById(id) {
  const sql = getSql()
  await sql`DELETE FROM scheduled_posts WHERE id = ${id}`
  return true
}

module.exports = {
  VALID_STATUSES,
  VALID_MEDIA_TYPES,
  upsertByExternalKey,
  create,
  findById,
  findByExternalKey,
  findDuePending,
  listAll,
  markPublishing,
  markPublished,
  markFailed,
  cancel,
  deleteById,
}
