# =============================================================
# PLUMAR — Push Marketing Infrastructure
# Execute no PowerShell: .\push_marketing_infra.ps1
# =============================================================

Write-Host "`n[PLUMAR] Iniciando push da infraestrutura de marketing..." -ForegroundColor Cyan

# Remove lock files que o VS Code pode ter deixado
$lockFiles = @(
    ".git\index.lock",
    ".git\HEAD.lock",
    ".git\refs\heads\master.lock",
    ".git\objects\maintenance.lock"
)

foreach ($lock in $lockFiles) {
    if (Test-Path $lock) {
        Remove-Item $lock -Force -ErrorAction SilentlyContinue
        Write-Host "  Removido: $lock" -ForegroundColor Yellow
    }
}

# Stage os arquivos novos e modificados
Write-Host "`n[1/4] Staging arquivos..." -ForegroundColor Green
git add frontend/public/comercial.html
git add frontend/public/robots.txt
git add frontend/public/sitemap.xml
git add frontend/public/marketing/UTM_LINKS.md
git add backend/src/routes/contact.routes.js

# Verifica o que foi staged
Write-Host "`n[2/4] Arquivos staged:" -ForegroundColor Green
git diff --cached --stat

# Commit
Write-Host "`n[3/4] Criando commit..." -ForegroundColor Green
git commit -m "feat: infraestrutura de marketing automatizado

- Google Analytics 4 e Facebook Pixel na landing page
- Meta tags completos (og:image, Twitter Cards, canonical)
- Leads salvos no PostgreSQL (tabela leads com UTM tracking)
- Endpoint GET /api/contact/leads para consulta de leads
- Pagina de obrigado inline com tracking de conversao (GA4 + Pixel)
- robots.txt e sitemap.xml para SEO
- UTM links mapeados para todos os 14 posts
- Script do formulario reconstruido (estava truncado)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# Push
Write-Host "`n[4/4] Pushing para origin/master..." -ForegroundColor Green
git push origin master

Write-Host "`n[PLUMAR] Concluido!" -ForegroundColor Cyan
Write-Host "Verifique em: https://github.com/AndersonAssisSouza/gestao-criatorio" -ForegroundColor Gray
Write-Host ""
