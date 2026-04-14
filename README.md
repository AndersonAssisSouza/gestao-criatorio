# 🐦 Gestão Criatório

Sistema web de gestão avícola — substituição do Power Apps por aplicação web independente com autenticação própria e dados no SharePoint via Microsoft Graph API.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Auth | JWT + bcrypt + cookie HttpOnly + CSRF |
| Dados (fase 1) | SharePoint via Microsoft Graph API |
| Banco usuários | Arquivo local persistente configurável (`backend/storage/users.json` por padrão) |
| Deploy | Frontend estático + backend Node/Vercel |

## Estrutura

```
gestao-criatorio/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express
└── README.md
```

## Módulos

| Módulo | Status |
|--------|--------|
| Login / Cadastro | Backend real |
| Gestão do Plantel | Backend real com escopo por criatório |
| Aves em Choco | Fase 2 |
| Gaiolas | Fase 2 |
| Filhotes | Fase 2 |
| Espécies | Fase 3 |
| Aviário | Fase 3 |
| Anéis | Fase 3 |
| Financeiro | Fase 4 |
| Ex-Plantel | Fase 4 |
| Simulação Mutações | Fase 4 |

## Setup Rápido

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Deploy (Vercel)

Consulte a documentação técnica `GestaoMiniatorio_DOC_TEC.docx` para instruções completas de deploy e configuração do Azure App Registration.

## Segurança implementada

- Sessão via cookie `HttpOnly` com CSRF token por cabeçalho
- Rate limit em login, cadastro e APIs protegidas
- Escopo de acesso ao plantel baseado no criatório vinculado ao usuário
- Validação básica de payloads no backend
- Cabeçalhos de hardening HTTP no Express

---

**Versão:** MVP v0.1 | **Autor:** Anderson Assis | **Abril 2026**
