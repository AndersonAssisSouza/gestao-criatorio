@echo off
setlocal enabledelayedexpansion
REM ============================================================
REM Aplicar setup Meta Graph API:
REM  1) Secrets META_* no Cloudflare Worker
REM  2) Migration 001_scheduled_posts.sql no Neon
REM  3) Seed dos 11 posts de marketing
REM ============================================================

cd /d "%~dp0"

echo ============================================================
echo  Carregando variaveis de .env.secrets
echo ============================================================
if not exist .env.secrets (
  echo [ERRO] .env.secrets nao encontrado em %cd%
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (".env.secrets") do (
  set "LINE=%%A"
  if not "\!LINE\!"=="" if not "\!LINE:~0,1\!"=="#" (
    set "%%A=%%B"
  )
)

if "%META_APP_ID%"=="" ( echo [ERRO] META_APP_ID vazio & exit /b 1 )
if "%META_PAGE_ID%"=="" ( echo [ERRO] META_PAGE_ID vazio & exit /b 1 )
if "%META_PAGE_ACCESS_TOKEN%"=="" ( echo [ERRO] META_PAGE_ACCESS_TOKEN vazio & exit /b 1 )
if "%DATABASE_URL%"=="" ( echo [ERRO] DATABASE_URL vazio & exit /b 1 )

echo Variaveis carregadas:
echo   META_APP_ID=%META_APP_ID%
echo   META_PAGE_ID=%META_PAGE_ID%
echo   META_PAGE_ACCESS_TOKEN=***oculto***
echo   META_IG_BUSINESS_ID=%META_IG_BUSINESS_ID%
echo   META_APP_SECRET=%META_APP_SECRET%
echo.

echo ============================================================
echo  [1/3] Aplicando secrets no Cloudflare Worker
echo ============================================================

echo %META_APP_ID%| npx.cmd wrangler secret put META_APP_ID
if errorlevel 1 goto err
echo %META_PAGE_ID%| npx.cmd wrangler secret put META_PAGE_ID
if errorlevel 1 goto err
echo %META_PAGE_ACCESS_TOKEN%| npx.cmd wrangler secret put META_PAGE_ACCESS_TOKEN
if errorlevel 1 goto err

if not "%META_IG_BUSINESS_ID%"=="" (
  echo %META_IG_BUSINESS_ID%| npx.cmd wrangler secret put META_IG_BUSINESS_ID
  if errorlevel 1 goto err
) else (
  echo [skip] META_IG_BUSINESS_ID vazio - IG desconectado, publicacao apenas no Facebook
)

if not "%META_APP_SECRET%"=="" (
  echo %META_APP_SECRET%| npx.cmd wrangler secret put META_APP_SECRET
  if errorlevel 1 goto err
) else (
  echo [skip] META_APP_SECRET vazio - renovacao de token long-lived nao automatizada
)

echo.
echo ============================================================
echo  [2/3] Rodando migration 001_scheduled_posts.sql no Neon
echo ============================================================
call node scripts\run-migration.js migrations\001_scheduled_posts.sql
if errorlevel 1 goto err

echo.
echo ============================================================
echo  [3/3] Seed dos 11 posts de marketing
echo ============================================================
call node scripts\seed-meta-posts.js
if errorlevel 1 goto err

echo.
echo ============================================================
echo  CONCLUIDO com sucesso\!
echo ============================================================
echo.
echo Proximos passos:
echo  - Cron "*/5 * * * *" ja esta no wrangler.toml
echo  - Forcar publicacao imediata de atrasados:
echo      curl -X POST -H "Authorization: Bearer OWNER_TOKEN" https://api.plumar.com.br/api/meta/sweep
echo  - Listar scheduled:
echo      curl -H "Authorization: Bearer OWNER_TOKEN" https://api.plumar.com.br/api/meta/scheduled
echo.
exit /b 0

:err
echo.
echo ============================================================
echo  FALHOU - Confira mensagem de erro acima
echo ============================================================
exit /b 1
