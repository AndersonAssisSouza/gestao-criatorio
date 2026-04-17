#requires -Version 5
# Substitui "7 dias" por "30 dias" em arquivos de marketing.
# NAO mexe em backend/src (onde 7 dias = direito de arrependimento CDC).
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$targets = @(
    'Marketing\posts_publicar\post_03.md',
    'Marketing\posts_publicar\post_06.md',
    'Marketing\posts_publicar\post_07.md',
    'Marketing\posts_publicar\post_09.md',
    'Marketing\posts_publicar\post_11.md',
    'Marketing\posts_publicar\post_12.md',
    'Marketing\posts_publicar\post_13.md',
    'Marketing\posts_publicar\post_14.md',
    'Marketing\meta-scheduler-console.js',
    'Marketing\CRONOGRAMA_PUBLICACOES.md',
    'Marketing\GUIA_AGENDAMENTO_MANUAL.md',
    'Marketing\publication_queue.csv',
    'PLUMAR_Posts_Redes_Sociais.md',
    'PLUMAR_Kit_Redes_Sociais.md',
    'PLUMAR_Guia_Execucao_Campanha.md',
    'PLUMAR_Plano_Marketing_Organico.md',
    'PLUMAR_Sequencia_Emails.md',
    'PLUMAR_Landing_Page.html',
    'PLUMAR_Pagina_Comercial.html',
    'frontend\index.html',
    'frontend\public\comercial.html',
    'docs\spec-meta-graph-api.md'
)

Write-Host "========================================"
Write-Host "  Substituindo 7 dias -> 30 dias (marketing)"
Write-Host "========================================"
Write-Host ""

$totalEdits = 0
foreach ($rel in $targets) {
    $path = Join-Path $PSScriptRoot $rel
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Host "  (pular, nao existe) $rel" -ForegroundColor DarkGray
        continue
    }
    $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $original = $content

    # Simples: "7 dias" -> "30 dias" e "7 Dias" -> "30 Dias" (preserva caps)
    $content = $content.Replace('7 dias', '30 dias').Replace('7 Dias', '30 Dias')

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
        $before = ([regex]::Matches($original, '7 [Dd]ias')).Count
        $after = ([regex]::Matches($content, '7 [Dd]ias')).Count
        $edits = $before - $after
        $totalEdits += $edits
        Write-Host "  OK ($edits subst.) $rel" -ForegroundColor Green
    } else {
        Write-Host "  (sem mencao) $rel" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Total de substituicoes: $totalEdits"
Write-Host "========================================"
