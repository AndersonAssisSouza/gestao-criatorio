-- Migration 001 — scheduled_posts
-- Tabela para agendamento automatizado de posts via Meta Graph API.
-- Executada pelo cron */5 do Worker quando scheduled_for <= now() e status='pending'.

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,                     -- chave opcional ('Post2', 'Post3', etc) para idempotência do seed
  title           TEXT NOT NULL,
  caption         TEXT NOT NULL,
  hashtags        TEXT,
  media_urls      TEXT[] NOT NULL,                 -- URLs públicas absolutas das mídias (plumar.com.br/marketing/...)
  media_type      TEXT NOT NULL,                   -- 'image' | 'carousel' | 'video' | 'reel' | 'story'
  platforms       TEXT[] NOT NULL,                 -- ['facebook'], ['instagram'], ou ambos
  scheduled_for   TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'publishing' | 'published' | 'failed' | 'canceled'
  published_ids   JSONB,                           -- {"facebook": "post_id", "instagram": "media_id"}
  error_message   TEXT,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pending
  ON scheduled_posts (scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_status
  ON scheduled_posts (status);

CREATE INDEX IF NOT EXISTS idx_scheduled_external_key
  ON scheduled_posts (external_key);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION touch_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scheduled_posts_touch ON scheduled_posts;
CREATE TRIGGER trg_scheduled_posts_touch
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION touch_scheduled_posts_updated_at();
