# =============================================================================
# HIGIENIZACAO URGENTE DO REPO PLUMAR
# Gerado em 2026-04-16 pelo Modo Auditor
#
# OBJETIVO:
#   1. Remover backend/.env.production-pulled do commit local d21268b
#      (ainda nao pushado - ALTO risco: JWT_SECRET, AZURE_CLIENT_SECRET,
#      MERCADOPAGO_ACCESS_TOKEN)
#   2. Destacar do git os arquivos .env sensiveis que JA estao no origin
#      (backend/.env.pulled, backend/.env.vercel.tmp) - o vazamento ja
#      ocorreu, mas impedimos que voltem em commits futuros.
#   3. Manter as mudancas boas do commit d21268b (runbook, marketing, etc).
#
# EXECUTAR APOS ter rotacionado os secrets na origem (Azure/Mercado Pago/etc).
# =============================================================================

$ErrorActionPreference = 'Stop'

Set-Location "C:\Users\ander\OneDrive - Luisa Moraes Advogados\Controle Geral\Codigos\gestao-criatorio"

Write-Host "==> Passo 1: Desfazer o commit d21268b preservando os arquivos como nao-staged" -ForegroundColor Cyan
git reset --mixed HEAD~1

Write-Host "`n==> Passo 2: Apagar fisicamente o arquivo com secrets de producao" -ForegroundColor Cyan
if (Test-Path "backend\.env.production-pulled") {
    Remove-Item "backend\.env.production-pulled" -Force
    Write-Host "   OK - backend\.env.production-pulled apagado"
} else {
    Write-Host "   Arquivo ja nao existe"
}

Write-Host "`n==> Passo 3: Remover do git os .env sensiveis (mantem no disco)" -ForegroundColor Cyan
# Esses arquivos JA estao no origin/master (ja vazaram).
# O git rm --cached tira eles do rastreamento sem apagar do disco.
git rm --cached backend/.env.pulled 2>$null
git rm --cached backend/.env.vercel.tmp 2>$null
git rm --cached frontend/.env.local 2>$null
git rm --cached frontend/.env.production 2>$null

Write-Host "`n==> Passo 4: Apagar do disco os dumps Vercel obsoletos (ja migramos)" -ForegroundColor Cyan
Remove-Item "backend\.env.pulled" -Force -ErrorAction SilentlyContinue
Remove-Item "backend\.env.vercel.tmp" -Force -ErrorAction SilentlyContinue
Remove-Item "backend\.env.vercel" -Force -ErrorAction SilentlyContinue
Write-Host "   OK - dumps Vercel apagados"

Write-Host "`n==> Passo 5: Verificar que o .gitignore cobre os padroes" -ForegroundColor Cyan
$gi = Get-Content .gitignore -Raw
if ($gi -notmatch "backend/\.env\.\*") {
    Write-Host "   AVISO: .gitignore pode estar faltando 'backend/.env.*' - revise manualmente" -ForegroundColor Yellow
} else {
    Write-Host "   OK - .gitignore cobre backend/.env.*"
}

Write-Host "`n==> Passo 6: Listar o que sobrou em staging/working tree para voce revisar" -ForegroundColor Cyan
Write-Host "--- staged ---"
git diff --cached --name-only
Write-Host "--- unstaged ---"
git diff --name-only
Write-Host "--- untracked ---"
git ls-files --others --exclude-standard | Select-Object -First 30

Write-Host "`n==> Passo 7: INSTRUCOES MANUAIS A PARTIR DAQUI" -ForegroundColor Yellow
Write-Host @"
Agora faca git add SELETIVO dos arquivos que queremos manter.
NUNCA use 'git add .' - isso pode reintroduzir secrets.

Exemplo:
  git add .gitignore
  git add docs/RUNBOOK-CICD.md
  git add Marketing/
  git add backend/scripts/set-cloudflare-secrets.sh
  git add .github/workflows/deploy.yml
  # revise cada um antes:
  git diff --cached

  # quando estiver satisfeito:
  git commit -m "chore: higienizar repo, remover .env expostos, adicionar runbook"

  # push:
  .\git-push.bat

IMPORTANTE sobre o vazamento historico:
  backend/.env.pulled e backend/.env.vercel.tmp ja estao no origin/master.
  Os VERCEL_OIDC_TOKEN neles ja estao expirados (exp: 13/abril).
  Se quiser removelos do historico publico, e preciso rodar git filter-repo
  (operacao destrutiva, reescreve commits). Me diga se quer fazer isso.
"@
