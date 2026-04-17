@echo off
echo === PLUMAR - Push Cloudflare Migration para GitHub ===
echo.

cd /d "%~dp0"

git add .github/workflows/deploy.yml
git add .github/workflows/deploy-pages.yml
git add deploy-frontend.ps1
git add .gitignore
git add frontend/public/comercial.html

git status

echo.
echo === Criando commit ===
git commit -m "feat: migrate frontend+backend deploy to Cloudflare (Pages + Workers)" -m "- Add frontend Pages deploy job to deploy.yml" -m "- Backend Worker deploy already configured" -m "- Add deploy-frontend.ps1 for manual deploys" -m "- Update .gitignore for sensitive files"

echo.
echo === Fazendo push para master ===
git push origin master

echo.
echo === Concluido! GitHub Actions ira disparar o deploy automatico. ===
echo Acompanhe em: https://github.com/AndersonAssisSouza/gestao-criatorio/actions
pause
