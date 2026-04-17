@echo off
chcp 65001 >nul
cd /d "%~dp0\frontend\public\marketing"

echo ========================================
echo   Deletando imagens com "7 dias" embutido
echo ========================================
echo.

set FILES=PLUMAR_Post3_Slide7.png PLUMAR_Post5_Reveal.png PLUMAR_Post7_Slide6.png PLUMAR_Post8_Facebook.png PLUMAR_Post9_Slide8.png PLUMAR_Post11_DicaManejo.png PLUMAR_Post12_Slide7.png PLUMAR_Post14_Urgencia.png

for %%F in (%FILES%) do (
    if exist "%%F" (
        del /F /Q "%%F"
        if errorlevel 1 (
            echo   FALHOU: %%F
        ) else (
            echo   OK: %%F
        )
    ) else (
        echo   Ja nao existia: %%F
    )
)

echo.
echo ========================================
echo   CONCLUIDO
echo ========================================
echo.
echo Arquivos deletados sao candidatos a re-renderizacao
echo com "30 dias" em vez de "7 dias":
echo   - Post 3 Slide 7 (CTA Carrossel Genetica)
echo   - Post 5 Reveal (oficial)
echo   - Post 7 Slide 6 (CTA Antes/Depois)
echo   - Post 8 Facebook (grupos)
echo   - Post 9 Slide 8 (CTA Tutorial)
echo   - Post 11 DicaManejo
echo   - Post 12 Slide 7 (CTA 5 Motivos)
echo   - Post 14 Urgencia
echo.
pause
