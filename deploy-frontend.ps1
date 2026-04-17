# Deploy Frontend para Cloudflare Pages
# Executa: .\deploy-frontend.ps1

Write-Host "=== PLUMAR - Deploy Frontend para Cloudflare Pages ===" -ForegroundColor Cyan

# Verifica se wrangler está instalado
$wrangler = Get-Command wrangler -ErrorAction SilentlyContinue
if (-not $wrangler) {
    Write-Host "Instalando Wrangler..." -ForegroundColor Yellow
    npm install -g wrangler
}

# Deploy dos arquivos estáticos
Write-Host "Fazendo deploy de frontend/public/ para plumar.pages.dev..." -ForegroundColor Green
wrangler pages deploy frontend/public --project-name=plumar

Write-Host ""
Write-Host "Deploy concluido! Site disponivel em:" -ForegroundColor Green
Write-Host "  https://plumar.pages.dev" -ForegroundColor White
Write-Host "  https://plumar.com.br (apos configurar DNS)" -ForegroundColor White
