@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   PLUMAR - Push Limpo Final
echo ========================================
echo.

REM Remove locks residuais
if exist ".git\index.lock" del ".git\index.lock"
if exist ".git\HEAD.lock" del ".git\HEAD.lock"

echo [1/8] Fetch origin/master...
git fetch origin master
if errorlevel 1 goto :error

echo.
echo [2/8] Commits atualmente a frente do origin/master:
git log --oneline origin/master..HEAD

echo.
echo [3/8] Soft reset para origin/master (descarta commits locais mantendo arquivos)...
git reset --soft origin/master
if errorlevel 1 goto :error

echo.
echo [4/8] Unstage de tudo...
git reset HEAD
if errorlevel 1 goto :error

echo.
echo [5/8] Deletando backend\.env.production-pulled do disco...
if exist "backend\.env.production-pulled" (
    del /F /Q "backend\.env.production-pulled"
    if exist "backend\.env.production-pulled" (
        echo ERRO: arquivo ainda existe. Delete manualmente.
        goto :error
    )
    echo   OK - arquivo removido.
) else (
    echo   Arquivo ja nao existia.
)

echo.
echo [6/8] Stage dos arquivos limpos...
git add .gitignore
git add backend/scripts/set-cloudflare-secrets.sh
git add backend/.env.secrets.example
git add Marketing/
git add PLUMAR_Plano_Marketing_Organico.md
git add cleanup-secrets.bat
git add push-clean.bat

echo.
echo [7/8] Confirmacao - arquivos staged:
git status --short
echo.
echo Alguma linha acima com ".env.production-pulled"? Se sim, ABORTAR (Ctrl+C).
echo Caso contrario, o commit e push vao acontecer a seguir.
echo.
pause

echo.
echo [8/8] Commit + push...
git commit -m "security: sanitize tracked secrets and add marketing schedule"
if errorlevel 1 goto :error

git push
if errorlevel 1 goto :push_error

echo.
echo ========================================
echo   SUCESSO - Push limpo concluido
echo ========================================
pause
exit /b 0

:error
echo.
echo ERRO na etapa acima. Abortando.
pause
exit /b 1

:push_error
echo.
echo PUSH BLOQUEADO. Provaveis causas:
echo   - Secret Scanning ainda detectou algo (ver saida acima)
echo   - Credenciais GitHub expiradas (rode: git credential-manager-core clear)
echo.
pause
exit /b 1
