# Setup externo Meta Graph API

Roteiro detalhado para obter os 4 valores que alimentam a integração PLUMAR ↔ Meta:

- `META_PAGE_ID` (público) — já conhecido: `1146018875251408`
- `META_PAGE_ACCESS_TOKEN` (secret, long-lived)
- `META_IG_BUSINESS_ID` (semi-público, numérico)
- `META_APP_SECRET` (secret do app, só usado para renovar token)

## 1. Criar App no Meta for Developers

1. Acesse https://developers.facebook.com/apps
2. Clique em **Create App** → escolha **Business** → Next
3. Nome do app: `PLUMAR Scheduler` (ou qualquer — não é visível ao público)
4. E-mail de contato: seu
5. Business Portfolio: selecione **PLUMAR** (o que acabou de sair da restrição)
6. Clique **Create App** e faça verificação de segurança se solicitada

Ao criar, anote:

- **App ID** (público) — topo do painel, formato `1234567890`
- **App Secret** (secret) — em **Settings → Basic → App Secret → Show**

## 2. Adicionar produtos ao App

No painel do App → **Add Product**:

- **Facebook Login for Business** → setup básico
- **Instagram** → setup; no fluxo escolha "Instagram Graph API" (para contas Business/Creator)
- **Webhooks** (opcional — só se for querer receber notificação de comentários)

## 3. Permissões necessárias (dev mode ou App Review)

No painel do App → **App Review → Permissions and Features**, habilite (ou peça) as permissões:

- `pages_manage_posts` — publicar posts
- `pages_read_engagement` — ler dados dos posts
- `instagram_basic` — ler conta IG
- `instagram_content_publish` — publicar no IG
- `pages_show_list` — listar páginas do usuário
- `business_management` — acesso ao Business Portfolio

**Enquanto estiver em dev mode**, só o **owner do App** (você) consegue usar. Para o PLUMAR isso é suficiente — você é quem publica.

Se quiser publicar usando outra identidade no futuro, submeta App Review (leva 3-7 dias úteis).

## 4. Gerar Page Access Token long-lived

**Passo 4.1 — User Access Token temporário:**

1. Acesse https://developers.facebook.com/tools/explorer/
2. Em **Meta App**, selecione o App criado
3. Em **User or Page**, escolha **User Token**
4. Clique em **Add a Permission** e adicione TODAS as 6 permissões listadas acima
5. Clique **Generate Access Token** e autorize no popup
6. Copie o token gerado — este é o **User Access Token (short-lived, 1-2h)**

**Passo 4.2 — Long-lived User Token (60 dias):**

No terminal:

```bash
SHORT_TOKEN="cole_o_user_token_aqui"
APP_ID="seu_app_id"
APP_SECRET="seu_app_secret"

curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_TOKEN}"
```

Retorno JSON tem o campo `access_token` — este é o **Long-lived User Token (~60 dias)**.

**Passo 4.3 — Page Access Token (não expira, vinculado à Page):**

```bash
LONG_USER_TOKEN="o_token_do_passo_4.2"

curl -s "https://graph.facebook.com/v21.0/me/accounts?access_token=${LONG_USER_TOKEN}"
```

A resposta lista todas as Pages. Encontre a entrada com `"id": "1146018875251408"` (Plumar — Gestão de Criatório). O valor do campo `access_token` nessa entrada é o **Page Access Token**. Copie esse.

Este token **não expira enquanto você não trocar a senha da sua conta, não revogar o app, ou não for deslogado por segurança**. Na prática dura meses.

## 5. Obter IG Business Account ID

```bash
PAGE_TOKEN="o_page_access_token"

curl -s "https://graph.facebook.com/v21.0/1146018875251408?fields=instagram_business_account&access_token=${PAGE_TOKEN}"
```

A resposta deve trazer algo como:

```json
{
  "instagram_business_account": {
    "id": "17841401234567890"
  },
  "id": "1146018875251408"
}
```

O valor em `instagram_business_account.id` é o **META_IG_BUSINESS_ID**.

## 6. Gravar secrets no Cloudflare Worker

Com os valores em mãos, em `backend/`:

```bash
cd backend

"seu_page_access_token"   | npx.cmd wrangler secret put META_PAGE_ACCESS_TOKEN
"1146018875251408"        | npx.cmd wrangler secret put META_PAGE_ID
"17841401234567890"       | npx.cmd wrangler secret put META_IG_BUSINESS_ID
"seu_app_secret"          | npx.cmd wrangler secret put META_APP_SECRET
"seu_app_id"              | npx.cmd wrangler secret put META_APP_ID
```

## 7. Rodar migration no Neon

Com `DATABASE_URL` preenchido no `backend/.env.secrets`:

```bash
cd backend
set -a; source .env.secrets; set +a
node scripts/run-migration.js migrations/001_scheduled_posts.sql
```

## 8. Seed do calendário

```bash
node scripts/seed-meta-posts.js --dry-run     # sanity-check
node scripts/seed-meta-posts.js               # grava os 11 posts
```

## 9. Teste fim-a-fim

Via endpoint HTTP (requer login do owner):

```bash
# Listar
curl -H "Authorization: Bearer $OWNER_TOKEN" https://api.plumar.com.br/api/meta/scheduled

# Forçar sweep imediato (não espera o cron)
curl -X POST -H "Authorization: Bearer $OWNER_TOKEN" https://api.plumar.com.br/api/meta/sweep
```

Ou: espera o cron `*/5 * * * *` disparar no próximo múltiplo de 5min (ver `backend/wrangler.toml`).

## Renovação do Page Access Token

Tokens Page costumam ser de longa duração (meses/anos), mas monitore. Se falharem com erro `OAuthException` código `190`, gere um novo começando no passo 4.

## Recursos

- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Docs `pages_manage_posts`: https://developers.facebook.com/docs/pages-api/posts
- Docs IG Graph API publicação: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
- Limites de publicação IG: 50 posts/dia por conta (reels contam)
