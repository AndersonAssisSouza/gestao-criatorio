#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh — Gestão Criatório
# Executa: chmod +x setup.sh && ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo ""
echo "🐦 Gestão Criatório — Setup"
echo "────────────────────────────────────────"

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ necessário. Versão atual: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Frontend
echo ""
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install --silent
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ .env.local criado (verifique as variáveis)"
fi
cd ..

# Backend
echo ""
echo "📦 Instalando dependências do backend..."
cd backend
npm install --silent
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env criado — PREENCHA as variáveis antes de rodar"
fi
cd ..

echo ""
echo "────────────────────────────────────────"
echo "✅ Setup concluído!"
echo ""
echo "Para rodar localmente:"
echo ""
echo "  Terminal 1 (frontend):"
echo "  cd frontend && npm run dev"
echo "  → http://localhost:3000"
echo ""
echo "  Terminal 2 (backend):"
echo "  cd backend && npm run dev"
echo "  → http://localhost:3001"
echo ""
echo "⚠️  Preencha backend/.env com as variáveis do Azure"
echo "   antes de conectar ao SharePoint real."
echo ""
echo "📄 Documentação: GestaoMiniatorio_DOC_TEC.docx"
echo "────────────────────────────────────────"
