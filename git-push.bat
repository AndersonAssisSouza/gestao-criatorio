@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   PLUMAR - Git Push Automatico
echo ========================================
echo.

REM Remove lock files se existirem
if exist ".git\index.lock" del ".git\index.lock"
if exist ".git\HEAD.lock" del ".git\HEAD.lock"

REM Mostra status
echo [1/4] Verificando alteracoes...
git status --short
echo.

REM Adiciona todas as alteracoes
echo [2/4] Adicionando arquivos...
git add -A
echo.

REM Pede mensagem de commit (ou usa padrao)
set /p MSG="Mensagem do commit (Enter para usar padrao): "
if "%MSG%"=="" set MSG=update: alteracoes automaticas via PLUMAR

echo.
echo [3/4] Commitando...
git commit -m "%MSG%"
echo.

echo [4/4] Enviando para GitHub...
git push origin master
echo.

if %ERRORLEVEL%==0 (
    echo ========================================
    echo   PUSH REALIZADO COM SUCESSO!
    echo   Deploy automatico no Render em breve.
    echo ========================================
) else (
    echo ========================================
    echo   ERRO no push. Verifique acima.
    echo ========================================
)

echo.
pause
