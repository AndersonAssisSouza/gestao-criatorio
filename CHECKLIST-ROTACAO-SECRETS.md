# CHECKLIST DE ROTACAO DE SECRETS - PLUMAR

**Gerado:** 2026-04-16 | **Origem:** backend/.env.production-pulled + backend/.env.pulled + backend/.env.vercel.tmp

## Prioridade CRITICA (rotacionar imediatamente)

### 1. JWT_SECRET
- **Valor vazado comeca com:** `593dbd95...` (128 hex chars)
- **Impacto:** todos os tokens JWT emitidos ate hoje continuam validos. Quem tiver esse secret pode forjar sessoes.
- **Acao:**
  1. Gerar novo secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
  2. `cd backend && npx wrangler secret put JWT_SECRET`
  3. Comunicar: **todos os usuarios logados serao deslogados ao deploy**.

### 2. AZURE_CLIENT_SECRET
- **Valor vazado:** `V4z8Q~[REVOGADO-EM-2026-04-16]` (secret antigo ja revogado no portal Azure)
- **App ID:** `fd564fde-1ec9-411c-a278-c03dcc3f7bb4`
- **Tenant:** `aadb5cad-6c69-4d6d-a942-e027203a4675`
- **Acao:**
  1. Portal Azure -> Azure Active Directory -> App registrations -> PLUMAR (client_id acima)
  2. Certificates & secrets -> New client secret -> gerar novo, copiar
  3. Deletar o segredo antigo (ou marcar como expirado ate voce confirmar o novo funcionando)
  4. `cd backend && npx wrangler secret put AZURE_CLIENT_SECRET`

### 3. MERCADOPAGO_ACCESS_TOKEN
- **Valor vazado:** `APP_USR-7393474620448478-041410-...-8673073`
- **Impacto:** acesso a conta do Mercado Pago (cobrancas, webhooks).
- **Acao:**
  1. Painel Mercado Pago -> Credenciais
  2. Rotacionar access token de producao
  3. `cd backend && npx wrangler secret put MERCADOPAGO_ACCESS_TOKEN`
  4. Atualizar eventuais webhooks/configs que usem o token antigo

## Prioridade MEDIA (verificar mas provavelmente expirado)

### 4. VERCEL_OIDC_TOKEN (dois valores diferentes vazaram)
- **Expiracao:** ambos com `exp: 1776263087` (~13/abril/2026) - **JA EXPIRARAM**
- **Acao:**
  1. Verificar no painel Vercel se a sessao correspondente foi revogada
  2. Como voce migrou para Cloudflare, pode simplesmente deletar a conta/projeto Vercel
  3. Nao e necessario rotacionar (token expirado e inutil)

## Verificacao pos-rotacao

Apos rotacionar os criticos, teste:
1. Login em producao (valida JWT_SECRET novo)
2. Pagamento via Mercado Pago (ambiente sandbox primeiro)
3. Integracao Azure (se aplicavel ao fluxo atual)

## Auditoria recomendada (opcional)

Apos estabilizar, rode no diretorio do repo:
```
git log --all --full-history -p -- backend/.env.production-pulled
git log --all --full-history -p -- backend/.env.pulled
git log --all --full-history -p -- backend/.env.vercel.tmp
```
Para ver todas as versoes dos secrets que passaram pelo git.

## Prevencao

Apos isso resolvido, instale um pre-commit hook que barra arquivos .env
(exceto .example). Exemplo usando `gitleaks`:

```
scoop install gitleaks
gitleaks detect --source . --verbose
```

E considere desligar o script de auto-commit "alteracoes automaticas via
PLUMAR" ate que ele tenha um filtro explicito de arquivos (nunca git add .).
