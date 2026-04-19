# Git Hooks — PLUMAR

Hooks versionados deste repositorio. Para ativa-los apos clonar:

```bash
git config core.hooksPath .githooks
```

## pre-commit

Bloqueia:

1. Qualquer arquivo `.env` / `.env.*` staged (exceto `*.example`)
2. Padroes comuns de secret no diff:
   - AWS Access Key / Secret
   - Google API key (`AIza…`)
   - GitHub token (`ghp_…`, `ghs_…`, etc.)
   - Slack token (`xoxb-…`, etc.)
   - Mercado Pago access token (`APP_USR-…`)
   - Chaves privadas PEM
   - JWT completo (3 segmentos)
   - Azure client secret (formato `Xn...~...`)

Se um padrao for sinalizado e for **comprovadamente falso-positivo** (ex.:
valor de exemplo em doc), voce pode:

- Mover o valor para `*.example` / `*.md`
- Ou, em ultimo caso: `git commit --no-verify` (nao recomendado)

## Novos hooks

Para adicionar outros hooks (`pre-push`, `commit-msg` etc.), basta criar o
arquivo neste diretorio com permissao de execucao. O `core.hooksPath` ja
cobre todos.
