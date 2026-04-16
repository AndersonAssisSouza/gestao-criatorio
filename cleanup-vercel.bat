@echo off
echo ====================================
echo  Removendo configs Vercel e Render
echo ====================================

cd /d "%~dp0"

echo.
echo Removendo backend/vercel.json...
del /f /q "backend\vercel.json" 2>nul

echo Removendo frontend/vercel.json...
del /f /q "frontend\vercel.json" 2>nul

echo Removendo render.yaml...
del /f /q "render.yaml" 2>nul

echo Removendo backend/.vercel/...
rmdir /s /q "backend\.vercel" 2>nul

echo Removendo frontend/.vercel/...
rmdir /s /q "frontend\.vercel" 2>nul

echo Removendo DEPLOY_BACKEND.md (instrucoes Render)...
del /f /q "DEPLOY_BACKEND.md" 2>nul

echo.
echo ====================================
echo  Limpeza concluida!
echo ====================================
echo.
echo Agora rode git-push.bat para enviar tudo.
pause
