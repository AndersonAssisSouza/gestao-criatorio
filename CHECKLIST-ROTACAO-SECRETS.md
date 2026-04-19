# CHECKLIST DE ROTACAO DE SECRETS - PLUMAR

**Gerado:** 2026-04-16 | **Fechado:** 2026-04-19
**Origem:** backend/.env.production-pulled + backend/.env.pulled + backend/.env.vercel.tmp

## Status Final

| Item | Status | Data | Notas |
|---|---|---|---|
| JWT_SECRET rotacionado | [OK] | 2026-04-16 | secret novo via `wrangler secret put`; usuarios deslogados no deploy |
| AZURE_CLIENT_SECRET rotacionado | [OK] | 2026-04-16 | secret antigo revogado no portal; novo em `wrangler` |
| MERCADOPAGO_ACCESS_TOKEN rotacionado | [OK] | 2026-04-16 | novo token aplicado no Worker em 2026-04-19 via workflow `set-worker-secrets` (antes estava falhando) |
| MP token antigo revogado | [OK] | 2026-04-16 | valido: 041410-... retorna HTTP 401 no teste |
| MERCADOPAGO_WEBHOOK_SECRET | [OK] | 2026-04-19 | obtido via DevTools no painel MP; aplicado no Worker; modo `enforce` validado (HMAC invalido retorna 401, valido passa) |
| VERCEL_OIDC_TOKEN | [EXPIRADO] | 2026-04-13 | tokens vazados expiraram naturalmente; Vercel deprovisionado |
| Remocao dos .env do indice git | [OK] | 2026-04-19 | commit `def6640` |
| Apagar dumps Vercel do disco | [OK] | 2026-04-19 | `.env.pulled`, `.env.vercel.tmp`, `.env.vercel`, `.env.production-new` |
| Pre-commit hook versionado | [OK] | 2026-04-19 | commit `56ec62c` — `.githooks/pre-commit` ativa via `git config core.hooksPath .githooks` |
| `.gitignore` cobre `backend/.env.*` | [OK] | - | validado com `git check-ignore` |
| backend/.env local com valores novos | [OK] | 2026-04-19 | sincronizado com `.env.secrets` (gitignored) |
| Workflow `set-worker-secrets` corrigido | [OK] | 2026-04-19 | commits `dfc52c5` + `78b7466` — antes falhava em 0s por `secrets` em `if:` |

## Risco Residual

**Historico publico do git:** contem dois `VERCEL_OIDC_TOKEN` (commits anteriores).
Ambos com `exp: 1776263087` / `1776242536` — **expirados em 13/abril/2026**.
Inuteis para ataque. **Nao ha necessidade de `git filter-repo`.**

Os secrets criticos (JWT_SECRET, AZURE_CLIENT_SECRET, MERCADOPAGO_ACCESS_TOKEN
com valor completo) **nunca entraram no historico publico** — o commit `d21268b`
que continha `.env.production-pulled` foi desfeito localmente pelo script
`HIGIENIZACAO-URGENTE.ps1` antes do push.

## Proximas camadas (opcionais)

1. ~~Instalar `gitleaks` no pipeline CI~~ → **SUBSTITUIDO** por GitHub Secret Scanning + Push Protection (2026-04-19)
2. ~~`dependabot` e `codeql`~~ → **ATIVADOS** Secret Scanning, Push Protection, Dependabot Security Updates (2026-04-19)
3. Rotacao periodica (180 dias) do JWT_SECRET como pratica.
4. Considerar `mise` / `dotenvx` para gerir secrets localmente sem `.env` em disco.

## Melhorias de segurança aplicadas 2026-04-19 (adicional)

- **GitHub Secret Scanning + Push Protection**: ativos — bloqueio automatico de secrets em push
- **Dependabot Security Updates**: ativo — PRs automaticos para CVEs
- **Branch protection em master**: status checks obrigatorios (Tests + Security Audit), no force push, no deletion
- **Frontend dependencies**: vite 5 → 7, axios atualizado, follow-redirects — 0 vulnerabilidades npm audit
- **CodeQL errors**: 2 `js/overwritten-property` corrigidos (user.repository.js, IndicacoesModule.jsx)
- **API key em query string**: removido de /api/contact/leads — apenas header `x-api-key` agora
- **Rate limiting global**: aplicado em `/api/*` como defesa em profundidade

## Verificacao pos-higienizacao

- [x] Login em producao testado — JWT novo funcional
- [x] Pagamento Mercado Pago sandbox OK
- [x] Build Cloudflare Pages verde
- [x] `git ls-files | grep -i env` retorna apenas `*.example`
- [x] Hook bloqueia `.test.env` em teste local (exit 1)

## Auditoria historica (opcional)

```bash
# ver todas as versoes que passaram pelo git
git log --all --full-history -p -- backend/.env.pulled
git log --all --full-history -p -- backend/.env.vercel.tmp
```

## Prevencao ativa

- `.githooks/pre-commit` bloqueia:
  - `*.env` e `*.env.*` (exceto `*.example`)
  - Padroes: AWS key, Google API, GitHub token, Slack, Mercado Pago, PEM, JWT, Azure secret
- `.gitignore` cobre `backend/.env.*` e `.env.*` globais
- `setup-secrets.ps1` fica fora do git (gitignored)

Ativar hooks apos clone:
```bash
git config core.hooksPath .githooks
```
