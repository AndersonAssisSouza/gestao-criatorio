# Deploy do Backend - Gestao Criatorio

## Deploy no Render.com (gratuito, 3 passos)

### 1. Criar conta no Render
- Acesse https://render.com
- Clique em "Get Started for Free"
- Conecte com sua conta GitHub

### 2. Deploy com Blueprint (1 clique)
- Acesse: https://render.com/deploy?repo=https://github.com/AndersonAssisSouza/gestao-criatorio
- O Render vai ler o `render.yaml` e criar automaticamente:
  - Web Service (backend Node.js)
  - Banco de dados PostgreSQL (gratuito)
  - Todas as variaveis de ambiente

### 3. Adicionar secrets no painel do Render
Apos o deploy, va em Dashboard > gestao-criatorio-api > Environment e adicione:

```
MERCADOPAGO_ACCESS_TOKEN = (seu token de producao do MercadoPago)
AZURE_TENANT_ID = (seu Tenant ID do Azure)
AZURE_CLIENT_ID = (seu Client ID do Azure)
AZURE_CLIENT_SECRET = (seu Client Secret do Azure)
SHAREPOINT_SITE_URL = (URL do seu site SharePoint)
```

> Os valores reais estao no arquivo `backend/.env` (que nao e commitado por seguranca).

### 4. Configurar webhook no MercadoPago
- Acesse https://www.mercadopago.com.br/developers/panel/app
- Em Webhooks, cadastre a URL:
  `https://gestao-criatorio-api.onrender.com/api/payments/mercadopago/webhook`
- Marque o evento: "Payments"

### 5. Atualizar frontend (eu farei isso automaticamente)
Depois de deployed, me informe a URL do backend (ex: https://gestao-criatorio-api.onrender.com)
e eu atualizo o frontend para apontar para o backend real.

## Verificar saude do backend
```
curl https://gestao-criatorio-api.onrender.com/health
```
Deve retornar: `{"status":"ok","version":"0.1.0",...}`
