@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   PLUMAR - Limpeza de segredos (soft reset + untrack)
echo ========================================
echo.

REM Remove lock files
if exist ".git\index.lock" del ".git\index.lock"

echo [1/6] Verificando commits pendentes...
git log --oneline origin/master..HEAD 2>nul
echo.

echo [2/6] Soft reset para origin/master (preserva arquivos no working dir)...
git fetch origin master
git reset --soft origin/master

echo.
echo [3/6] Removendo arquivos com secrets do stage e do tracking...
git reset HEAD backend/.env.production-pulled 2>nul
git rm --cached backend/.env.production-pulled 2>nul
if exist "backend\.env.production-pulled" del "backend\.env.production-pulled"

REM set-cloudflare-secrets.sh ja foi sanitizado — apenas garantir que nao tenha versao antiga staged
git reset HEAD backend/scripts/set-cloudflare-secrets.sh 2>nul

echo.
echo [4/6] Arquivos staged apos limpeza:
git diff --cached --name-only

echo.
echo [5/6] Arquivos modificados/novos ainda no working dir:
git status --short

echo.
echo [6/6] Pronto para commit limpo.
echo.
echo ========================================
echo   PROXIMOS PASSOS
echo ========================================
echo.
echo 1. Rotacione no painel do provedor: MercadoPago, Neon, Azure, Supabase.
echo    (O agente vai abrir os paineis em abas do Chrome para te guiar.)
echo.
echo 2. Preencha backend\.env.secrets com os novos valores rotacionados.
echo.
echo 3. Aplique os novos secrets ao Worker:
echo    cd backend
echo    set -a ^&^& source .env.secrets ^&^& set +a
echo    bash scripts/set-cloudflare-secrets.sh
echo.
echo 4. Para commitar apenas arquivos limpos:
echo    git add .gitignore backend/.env.secrets.example backend/scripts/set-cloudflare-secrets.sh
echo    git add Marketing/ PLUMAR_Plano_Marketing_Organico.md
echo    git commit -m "security: rotate secrets and sanitize tracked files + marketing schedule"
echo    git push
echo.
pause
