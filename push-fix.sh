#!/bin/bash
cd "$(dirname "$0")"
rm -f .git/index.lock
git add frontend/public/comercial.html
git commit -m "fix: restore UTF-8 accented characters in comercial.html"
git push origin master
echo ""
echo "✅ Push realizado com sucesso! O deploy será automático no Render."
echo "Pressione qualquer tecla para fechar..."
read -n 1
