#!/bin/bash
# =============================================================================
# Script para configurar secrets do Worker gestao-criatorio-api no Cloudflare
#
# PRÉ-REQUISITOS:
#   npm install -g wrangler
#   wrangler login
#   Ter um arquivo backend/.env.secrets (git-ignored) com os valores reais
#
# USO:
#   cd backend
#   set -a; source .env.secrets; set +a; bash scripts/set-cloudflare-secrets.sh
#
# ATENÇÃO: NUNCA hardcode tokens/senhas neste arquivo. Este script lê tudo de
# variáveis de ambiente. Segredos vão em .env.secrets (fora do git).
# =============================================================================

set -e

required_vars=(
  JWT_SECRET
  DATABASE_URL
  SUPABASE_URL
  SUPABASE_ANON_KEY
  MERCADOPAGO_ACCESS_TOKEN
  OWNER_EMAIL
  OWNER_NAME
  OWNER_PASSWORD
  OWNER_ACCESS_KEY
  FRONTEND_URL
  FRONTEND_PUBLIC_URL
)

echo "=== Verificando variaveis de ambiente ==="
missing=0
for v in "${required_vars[@]}"; do
  if [[ -z "${!v}" ]]; then
    echo "  FALTANDO: $v"
    missing=1
  fi
done
if [[ $missing -eq 1 ]]; then
  echo ""
  echo "ERRO: preencha backend/.env.secrets antes de rodar."
  echo "Modelo em backend/.env.secrets.example"
  exit 1
fi

echo "OK. Aplicando secrets ao Worker gestao-criatorio-api..."
echo ""

put_secret() {
  local key="$1"
  local value="$2"
  echo "Setting $key..."
  echo "$value" | npx wrangler secret put "$key"
}

put_secret JWT_SECRET                "$JWT_SECRET"
put_secret DATABASE_URL              "$DATABASE_URL"
put_secret SUPABASE_URL              "$SUPABASE_URL"
put_secret SUPABASE_ANON_KEY         "$SUPABASE_ANON_KEY"
put_secret MERCADOPAGO_ACCESS_TOKEN  "$MERCADOPAGO_ACCESS_TOKEN"
put_secret OWNER_EMAIL               "$OWNER_EMAIL"
put_secret OWNER_NAME                "$OWNER_NAME"
put_secret OWNER_PASSWORD            "$OWNER_PASSWORD"
put_secret OWNER_ACCESS_KEY          "$OWNER_ACCESS_KEY"
put_secret FRONTEND_URL              "$FRONTEND_URL"
put_secret FRONTEND_PUBLIC_URL       "$FRONTEND_PUBLIC_URL"

# Opcionais
[[ -n "$MERCADOPAGO_WEBHOOK_SECRET" ]] && put_secret MERCADOPAGO_WEBHOOK_SECRET "$MERCADOPAGO_WEBHOOK_SECRET"
[[ -n "$LEADS_API_KEY" ]]             && put_secret LEADS_API_KEY             "$LEADS_API_KEY"
[[ -n "$AZURE_CLIENT_ID" ]]           && put_secret AZURE_CLIENT_ID           "$AZURE_CLIENT_ID"
[[ -n "$AZURE_CLIENT_SECRET" ]]       && put_secret AZURE_CLIENT_SECRET       "$AZURE_CLIENT_SECRET"
[[ -n "$AZURE_TENANT_ID" ]]           && put_secret AZURE_TENANT_ID           "$AZURE_TENANT_ID"

echo ""
echo "=== CONCLUIDO ==="
echo "Para verificar: npx wrangler secret list"
