/**
 * Endpoints admin para agendamento automatizado via Meta Graph API.
 */
'use strict'

const repo = require('../repositories/scheduled-posts.repository')
const publisher = require('../services/meta-publisher.service')

function parsePlatforms(str) {
  if (Array.isArray(str)) return str.map((s) => String(s).toLowerCase().trim()).filter(Boolean)
  return String(str || '')
    .toLowerCase()
    .split(/[,+]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith('fb') || s === 'facebook' ? 'facebook' : s === 'ig' ? 'instagram' : s))
}

async function scheduleOne(req, res) {
  try {
    const body = req.body || {}
    if (!body.title || !body.caption || !body.mediaUrls || !body.mediaType || !body.platforms || !body.scheduledFor) {
      return res.status(400).json({ error: 'Campos obrigatórios: title, caption, mediaUrls, mediaType, platforms, scheduledFor' })
    }
    const post = body.externalKey
      ? await repo.upsertByExternalKey({
          externalKey: body.externalKey,
          title: body.title,
          caption: body.caption,
          hashtags: body.hashtags,
          mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [body.mediaUrls],
          mediaType: body.mediaType,
          platforms: parsePlatforms(body.platforms),
          scheduledFor: body.scheduledFor,
        })
      : await repo.create({
          title: body.title,
          caption: body.caption,
          hashtags: body.hashtags,
          mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [body.mediaUrls],
          mediaType: body.mediaType,
          platforms: parsePlatforms(body.platforms),
          scheduledFor: body.scheduledFor,
        })
    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function listScheduled(req, res) {
  try {
    const { status, limit } = req.query || {}
    const list = await repo.listAll({
      status: status || null,
      limit: limit ? parseInt(limit, 10) : 100,
    })
    res.json({ count: list.length, items: list })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function getScheduled(req, res) {
  try {
    const post = await repo.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Não encontrado' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function cancelScheduled(req, res) {
  try {
    const post = await repo.cancel(req.params.id)
    if (!post) return res.status(404).json({ error: 'Não encontrado ou já publicado' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function deleteScheduled(req, res) {
  try {
    await repo.deleteById(req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function publishNow(req, res) {
  try {
    const post = await repo.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Não encontrado' })
    if (post.status === 'published') return res.status(409).json({ error: 'Já publicado' })
    const result = await publisher.publishScheduled(post)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function runDueSweep(req, res) {
  try {
    const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 10
    const results = await publisher.runDueSweep({ limit })
    res.json({ count: results.length, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  scheduleOne,
  listScheduled,
  getScheduled,
  cancelScheduled,
  deleteScheduled,
  publishNow,
  runDueSweep,
}
