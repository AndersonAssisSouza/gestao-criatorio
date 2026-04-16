# Push GA4 integration + Pixel commented + LEADS_API_KEY in render.yaml
# Execute no PowerShell a partir da raiz do projeto

cd "$PSScriptRoot"

git add frontend/public/comercial.html
git add render.yaml

git commit -m "feat: integrar GA4 real (G-QNRCMC9GS2), comentar Pixel pendente, adicionar LEADS_API_KEY ao render.yaml"

git push origin master

Write-Host ""
Write-Host "Push concluido com sucesso!" -ForegroundColor Green
Write-Host "Alteracoes:"
Write-Host "  - comercial.html: GA4 G-QNRCMC9GS2 ativo, Facebook Pixel comentado"
Write-Host "  - render.yaml: LEADS_API_KEY adicionada"
