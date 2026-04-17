# Spec — Integração Meta Graph API no Worker PLUMAR

**Objetivo:** remover o atrito manual de agendar posts no Meta Business Suite automatizando via API. Depois de implementado, qualquer post do calendário vira um registro no banco e o Cloudflare Cron dispara a publicação na hora certa.

**Escopo:** Facebook Page + Instagram Business. WhatsApp Business API fica fora desta spec (tem fluxo e billing próprios).

---

## Pré-requisitos externos

1. **Instagram Business vinculado ao Facebook Page.** Fazer no Meta Business Suite: home → "Conectar Instagram" → autorizar `@plumar.app`.
2. **App Meta criado** em https://developers.facebook.com/apps (tipo "Business"). Solicitar permissões:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
3. **Page Access Token de longa duração** (60 dias, renovável). Fluxo:
   - Gerar short-lived token no Graph API Explorer
   - Trocar por long-lived via `GET /oauth/access_token?grant_type=fb_exchange_token&...`
   - Trocar por Page token via `GET /{user-id}/accounts`
4. **App Review** (se for usar em produção fora do círculo de devs): Meta exige revisão para `pages_manage_posts` e `instagram_content_publish`. Processo leva 3–7 dias úteis.

---

## Arquitetura proposta

### Tabela `scheduled_posts` (Neon Postgres)

```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  hashtags TEXT,
  media_urls TEXT[] NOT NULL,         -- URLs públicas das mídias em plumar.com.br/marketing/
  media_type TEXT NOT NULL,           -- 'image' | 'carousel' | 'video' | 'reel' | 'story'
  platforms TEXT[] NOT NULL,          -- ['facebook', 'instagram']
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'publishing' | 'published' | 'failed'
  published_ids JSONB,                -- {"facebook": "post_id", "instagram": "media_id"}
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scheduled_pending ON scheduled_posts (scheduled_for) WHERE status = 'pending';
```

### Endpoints do Worker (`backend/src/routes/meta.routes.js`)

- `POST /api/meta/schedule` — cria registro em `scheduled_posts` a partir de um payload JSON
- `GET /api/meta/scheduled` — lista posts pendentes/publicados
- `DELETE /api/meta/scheduled/:id` — cancela agendamento pendente
- `POST /api/meta/publish-now/:id` — força publicação imediata (override do schedule)

### Worker interno (`backend/src/services/meta-publisher.service.js`)

Função `publishScheduled(post)`:
- Para cada platform em `post.platforms`:
  - Se `facebook`:
    - `image`: `POST /{page-id}/photos` com `url` + `published=false`, depois `POST /{page-id}/feed` com `attached_media`
    - `carousel`: múltiplos `POST /{page-id}/photos` `published=false`, depois `POST /{page-id}/feed` com `attached_media` array
    - `video`/`reel`: `POST /{page-id}/videos` com `file_url` + `description`
  - Se `instagram`:
    - `image`: `POST /{ig-user-id}/media` → `POST /{ig-user-id}/media_publish`
    - `carousel`: N `POST /{ig-user-id}/media` como children → `POST /{ig-user-id}/media` com `media_type=CAROUSEL` e `children`, depois `media_publish`
    - `reel`: `POST /{ig-user-id}/media` com `media_type=REELS` + `video_url` → `media_publish`
    - `story`: `POST /{ig-user-id}/media` com `media_type=STORIES` → `media_publish`
- Atualiza `published_ids` e `status='published'` (ou `failed` com `error_message`)

### Cron Trigger (`backend/wrangler.toml`)

```toml
[triggers]
crons = ["*/5 * * * *"]   # a cada 5 min
```

No `scheduled` handler do Worker:
```js
async scheduled(event, env, ctx) {
  const due = await db.query(
    `SELECT * FROM scheduled_posts 
     WHERE status='pending' AND scheduled_for <= now() 
     ORDER BY scheduled_for LIMIT 10`
  );
  for (const post of due) {
    ctx.waitUntil(publishScheduled(post, env));
  }
}
```

### Secrets novos no Worker

- `META_APP_ID`
- `META_APP_SECRET`
- `META_PAGE_ID` (já temos: `1146018875251408`)
- `META_PAGE_ACCESS_TOKEN` (long-lived)
- `META_IG_BUSINESS_ID` (pegar via `GET /{page-id}?fields=instagram_business_account`)

### Renovação automática do token (60 dias)

Cron diário que chama `GET /oauth/access_token?grant_type=fb_exchange_token&...` e atualiza o secret via API do Cloudflare (ou manda email se faltar <5 dias pra expirar).

---

## Estimativa de esforço

| Task | Horas |
|------|-------|
| Setup app Meta + tokens + permissões | 1.5 |
| Tabela + migrations | 0.5 |
| Endpoints + CRUD | 1.5 |
| Publisher service (FB + IG) | 3 |
| Cron + retry + error handling | 1.5 |
| Testes e1e em ambiente staging | 2 |
| App Review Meta (async) | — |
| **Total implementação** | **~10h** |

---

## Próximo passo recomendado

Abrir issue "feat: Meta Graph API integration for scheduled publishing" e priorizar no próximo sprint. Ganho: agendamento de uma campanha inteira em ~2 min (vs 20+ min manual por campanha), e consistência com o calendário que já existe no repo.
