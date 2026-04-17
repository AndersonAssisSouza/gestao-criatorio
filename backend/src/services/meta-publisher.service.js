/**
 * Meta Graph API publisher — publica em Facebook Page e Instagram Business.
 *
 * Secrets esperados no env:
 *   META_GRAPH_VERSION         (opcional, default v21.0)
 *   META_PAGE_ID
 *   META_PAGE_ACCESS_TOKEN     (long-lived, renovado periodicamente)
 *   META_IG_BUSINESS_ID
 *
 * Uso:
 *   const { publishScheduled } = require('./services/meta-publisher.service')
 *   const result = await publishScheduled(post)
 */
'use strict'

const repo = require('../repositories/scheduled-posts.repository')

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0'
const GRAPH_HOST = `https://graph.facebook.com/${GRAPH_VERSION}`

function env(name) {
  const val = process.env[name]
  if (!val) throw new Error(`Secret ausente: ${name}`)
  return val
}

async function graphRequest(method, path, body = null, token = null) {
  const url = `${GRAPH_HOST}${path.startsWith('/') ? path : '/' + path}`
  const headers = { 'content-type': 'application/json' }
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)
  if (token) {
    const sep = url.includes('?') ? '&' : '?'
    const finalUrl = `${url}${sep}access_token=${encodeURIComponent(token)}`
    const res = await fetch(finalUrl, opts)
    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(`Graph API ${method} ${path}: ${JSON.stringify(data.error || data)}`)
    }
    return data
  }
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(`Graph API ${method} ${path}: ${JSON.stringify(data.error || data)}`)
  }
  return data
}

function captionWithHashtags(post) {
  const caption = post.caption || ''
  if (post.hashtags && !caption.includes('#')) {
    return `${caption}\n\n${post.hashtags}`
  }
  return caption
}

// ─── Facebook Page ─────────────────────────────────────────────────────────

async function publishFacebookImage(post) {
  const pageId = env('META_PAGE_ID')
  const token = env('META_PAGE_ACCESS_TOKEN')
  const [mediaUrl] = post.mediaUrls
  const data = await graphRequest('POST', `/${pageId}/photos`, {
    url: mediaUrl,
    caption: captionWithHashtags(post),
    published: true,
  }, token)
  return data.post_id || data.id
}

async function publishFacebookCarousel(post) {
  const pageId = env('META_PAGE_ID')
  const token = env('META_PAGE_ACCESS_TOKEN')
  // 1) Upload cada imagem como unpublished
  const mediaIds = []
  for (const url of post.mediaUrls) {
    const data = await graphRequest('POST', `/${pageId}/photos`, {
      url,
      published: false,
    }, token)
    mediaIds.push(data.id)
  }
  // 2) Cria feed post com attached_media
  const data = await graphRequest('POST', `/${pageId}/feed`, {
    message: captionWithHashtags(post),
    attached_media: mediaIds.map((id) => ({ media_fbid: id })),
  }, token)
  return data.id
}

async function publishFacebookVideo(post) {
  const pageId = env('META_PAGE_ID')
  const token = env('META_PAGE_ACCESS_TOKEN')
  const [videoUrl] = post.mediaUrls
  // Publica como reel se mediaType=reel
  const endpoint = post.mediaType === 'reel' ? `/${pageId}/video_reels` : `/${pageId}/videos`
  const body = post.mediaType === 'reel'
    ? { upload_phase: 'start', video_state: 'PUBLISHED' }
    : { file_url: videoUrl, description: captionWithHashtags(post), published: true }
  // NOTA: FB reels têm fluxo multi-etapa (start → upload → finish).
  // Para simplificar, usa /videos com published:true que aceita file_url.
  // Reels via file_url: POST /{page-id}/videos com descrição e o próprio FB converte.
  const data = await graphRequest('POST', endpoint, body, token)
  return data.id
}

// ─── Instagram Business ─────────────────────────────────────────────────────

async function createIgContainer(params) {
  const igId = env('META_IG_BUSINESS_ID')
  const token = env('META_PAGE_ACCESS_TOKEN')
  const data = await graphRequest('POST', `/${igId}/media`, params, token)
  return data.id
}

async function publishIgContainer(creationId) {
  const igId = env('META_IG_BUSINESS_ID')
  const token = env('META_PAGE_ACCESS_TOKEN')
  const data = await graphRequest('POST', `/${igId}/media_publish`, { creation_id: creationId }, token)
  return data.id
}

async function waitIgContainerReady(creationId, maxWaitMs = 120000) {
  const token = env('META_PAGE_ACCESS_TOKEN')
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    const data = await graphRequest('GET', `/${creationId}?fields=status_code,status`, null, token)
    if (data.status_code === 'FINISHED') return true
    if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
      throw new Error(`IG container status: ${data.status_code} — ${data.status || ''}`)
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('Timeout aguardando container IG ficar FINISHED')
}

async function publishInstagramImage(post) {
  const [mediaUrl] = post.mediaUrls
  const creationId = await createIgContainer({
    image_url: mediaUrl,
    caption: captionWithHashtags(post),
  })
  return publishIgContainer(creationId)
}

async function publishInstagramCarousel(post) {
  // 1) Cria children containers
  const childrenIds = []
  for (const url of post.mediaUrls) {
    const cid = await createIgContainer({
      image_url: url,
      is_carousel_item: true,
    })
    childrenIds.push(cid)
  }
  // 2) Cria container pai CAROUSEL
  const parentId = await createIgContainer({
    media_type: 'CAROUSEL',
    caption: captionWithHashtags(post),
    children: childrenIds.join(','),
  })
  return publishIgContainer(parentId)
}

async function publishInstagramReel(post) {
  const [videoUrl] = post.mediaUrls
  const creationId = await createIgContainer({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: captionWithHashtags(post),
    share_to_feed: true,
  })
  await waitIgContainerReady(creationId)
  return publishIgContainer(creationId)
}

async function publishInstagramStory(post) {
  const [mediaUrl] = post.mediaUrls
  const params = { media_type: 'STORIES' }
  if (/\.(mp4|mov)(\?|$)/i.test(mediaUrl)) {
    params.video_url = mediaUrl
  } else {
    params.image_url = mediaUrl
  }
  const creationId = await createIgContainer(params)
  if (params.video_url) await waitIgContainerReady(creationId)
  return publishIgContainer(creationId)
}

// ─── Orquestrador ──────────────────────────────────────────────────────────

async function publishToPlatform(platform, post) {
  if (platform === 'facebook') {
    if (post.mediaType === 'image') return publishFacebookImage(post)
    if (post.mediaType === 'carousel') return publishFacebookCarousel(post)
    if (post.mediaType === 'video' || post.mediaType === 'reel') return publishFacebookVideo(post)
    if (post.mediaType === 'story') throw new Error('Facebook Stories não suportadas via API')
  }
  if (platform === 'instagram') {
    if (post.mediaType === 'image') return publishInstagramImage(post)
    if (post.mediaType === 'carousel') return publishInstagramCarousel(post)
    if (post.mediaType === 'reel' || post.mediaType === 'video') return publishInstagramReel(post)
    if (post.mediaType === 'story') return publishInstagramStory(post)
  }
  throw new Error(`Plataforma desconhecida: ${platform}`)
}

async function publishScheduled(post) {
  const publishing = await repo.markPublishing(post.id)
  if (!publishing) return { skipped: true, reason: 'não-pending' }

  const publishedIds = {}
  const errors = []
  const skipped = []

  for (const platform of post.platforms) {
    // Pula IG se IG Business Account nao conectado
    if (platform === 'instagram' && !process.env.META_IG_BUSINESS_ID) {
      console.log(`[meta-publisher] Skip IG para post ${post.id} — META_IG_BUSINESS_ID vazio (IG desconectado da Page)`)
      skipped.push(platform)
      continue
    }
    try {
      const id = await publishToPlatform(platform, post)
      publishedIds[platform] = id
    } catch (err) {
      errors.push(`[${platform}] ${err.message}`)
    }
  }

  // Se todas as plataformas foram skippadas (nao falha, mas nao publicou), deixa pending
  if (skipped.length === post.platforms.length && errors.length === 0) {
    await repo.markFailed(post.id, `Todas plataformas skipped (faltam credenciais): ${skipped.join(',')}`)
    return { success: false, skipped, errors: [] }
  }

  if (errors.length > 0 && Object.keys(publishedIds).length === 0) {
    await repo.markFailed(post.id, errors.join(' | '))
    return { success: false, errors }
  }

  await repo.markPublished(post.id, publishedIds)
  return { success: true, publishedIds, partialErrors: errors, skipped }
}

async function runDueSweep({ limit = 10 } = {}) {
  const due = await repo.findDuePending(limit)
  const results = []
  for (const post of due) {
    try {
      const result = await publishScheduled(post)
      results.push({ id: post.id, externalKey: post.externalKey, ...result })
    } catch (err) {
      await repo.markFailed(post.id, err.message)
      results.push({ id: post.id, externalKey: post.externalKey, success: false, error: err.message })
    }
  }
  return results
}

module.exports = {
  publishScheduled,
  runDueSweep,
  publishFacebookImage,
  publishFacebookCarousel,
  publishFacebookVideo,
  publishInstagramImage,
  publishInstagramCarousel,
  publishInstagramReel,
  publishInstagramStory,
}
