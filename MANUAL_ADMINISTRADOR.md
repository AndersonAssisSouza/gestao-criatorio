# PLUMAR — Manual do Administrador (Proprietário)

**Gestão inteligente para criatórios**
*Guia completo para o perfil de proprietário/administrador do sistema*

---

## Sumário

1. [Visão Geral do Perfil Proprietário](#1-visão-geral-do-perfil-proprietário)
2. [Acesso e Privilégios](#2-acesso-e-privilégios)
3. [Painel do Proprietário — Gestão de Assinantes](#3-painel-do-proprietário--gestão-de-assinantes)
4. [Módulo Mutações — Simulador Genético](#4-módulo-mutações--simulador-genético)
5. [Gerenciamento de Pagamentos](#5-gerenciamento-de-pagamentos)
6. [Controle de Acesso dos Usuários](#6-controle-de-acesso-dos-usuários)
7. [Todos os Módulos Operacionais](#7-todos-os-módulos-operacionais)
8. [Configuração Técnica do Backend](#8-configuração-técnica-do-backend)
9. [Fluxo Completo de um Novo Assinante](#9-fluxo-completo-de-um-novo-assinante)
10. [Resolução de Problemas](#10-resolução-de-problemas)

---

## 1. Visão Geral do Perfil Proprietário

O perfil **Proprietário (owner)** é o nível mais alto de acesso no PLUMAR. Ele possui:

- Acesso vitalício e permanente (nunca expira)
- Acesso a **todos os módulos** do sistema, incluindo os exclusivos
- Capacidade de gerenciar assinantes, pagamentos e acessos
- Simulador genético de mutações (módulo exclusivo)

### Diferenças entre perfis

| Recurso | Usuário | Admin | Proprietário |
|---------|:-------:|:-----:|:------------:|
| Módulos operacionais (Plantel, Gaiolas, etc.) | Com assinatura | Sim | Sim |
| Módulo Assinatura | Sim | Sim | Sim |
| Configurações | Sim | Sim | Sim |
| Módulo Mutações | Não | Não | **Sim** |
| Painel do Proprietário | Não | Não | **Sim** |
| Gerenciar assinantes | Não | Não | **Sim** |
| Aprovar/rejeitar pagamentos | Não | Não | **Sim** |
| Conceder/revogar acesso | Não | Não | **Sim** |
| Acesso vitalício | Não | Não | **Sim** |

---

## 2. Acesso e Privilégios

### 2.1 Menu lateral do Proprietário

Sua barra lateral exibe **todos** os grupos de módulos:

**Manejo:**
- Plantel
- Aves em Choco
- Gaiolas
- Filhotes

**Cadastros:**
- Espécies
- Criatórios
- Anéis

**Análise:**
- Financeiro
- Ex-Plantel
- **Mutações** (exclusivo)

**Sistema:**
- Assinatura
- **Proprietário** (exclusivo)
- Configurações

### 2.2 Identificação do perfil

No rodapé da barra lateral, seu perfil mostra:
- Suas iniciais no avatar circular
- Seu nome
- Label: **"Vitalício"** (indicando acesso permanente)

---

## 3. Painel do Proprietário — Gestão de Assinantes

O módulo **Proprietário** é o centro de controle administrativo.

### 3.1 Cards de estatísticas

No topo do painel, quatro indicadores mostram a saúde do negócio:

| Card | Descrição |
|------|-----------|
| **Clientes** | Total de usuários cadastrados (excluindo o proprietário) |
| **Ativos** | Usuários com acesso liberado (assinatura ativa) |
| **Cobranças** | Pagamentos pendentes de validação |
| **Trial** | Usuários no período de teste gratuito (7 dias) |

### 3.2 Lista de assinantes

A tabela principal exibe todos os usuários do sistema:

| Coluna | Descrição |
|--------|-----------|
| **Nome** | Nome do usuário |
| **Email** | E-mail de cadastro |
| **Plano** | Anual, Mensal, Vitalício ou Trial |
| **Expira em** | Data de expiração ou "Sem vencimento" |
| **Status** | Indicador visual (verde = ativo, vermelho = bloqueado) |

### 3.3 Selecionando um assinante

Clique na linha de um assinante para:
- Ver os **detalhes completos** do usuário
- Acessar o **histórico de pagamentos** do usuário
- Executar **ações administrativas** (conceder acesso, aprovar pagamento, etc.)

---

## 4. Módulo Mutações — Simulador Genético

Este módulo exclusivo do proprietário é um simulador de cruzamentos genéticos para Tarin (Spinus cucullatus), baseado na referência "TARIM — Acasalamentos entre mutações" de Décio Junior.

### 4.1 Como funciona

1. Selecione a **mutação do macho** (pai)
2. Selecione a **mutação da fêmea** (mãe)
3. O sistema calcula automaticamente as probabilidades genéticas dos filhotes

### 4.2 Mutações disponíveis

O simulador trabalha com as seguintes mutações, cada uma com código de cor:

| Mutação | Cor do Badge | Tipo Genético |
|---------|:------------|---------------|
| Ancestral | Vermelho | Selvagem (sem mutação) |
| Canela | Marrom | Ligada ao sexo |
| Pastel | Rosa | Ligada ao sexo |
| Canela Pastel | Lilás | Ligada ao sexo (dupla) |
| Topázio | Dourado | Autossômico recessivo |
| Diluído | Rosa claro | Autossômico dominante |
| Duplo Diluído | Rosa muito claro | Autossômico dominante (homozigoto) |
| Portador de Canela | Bege | Macho portador |
| Portador de Pastel | Rosa claro | Macho portador |
| Portador de Topázio | Dourado claro | Portador |
| Passepartout Tipo I e II | Lavanda | Crossing-over |

### 4.3 Base de cruzamentos

O sistema possui **51 cenários de cruzamento** pré-calculados, incluindo:
- Cruzamentos entre mutações puras
- Combinações com portadores
- Cenários de crossing-over (Passepartout)
- Cálculos de probabilidade em porcentagem para machos e fêmeas separadamente

### 4.4 Opção de Crossing-over

Para cruzamentos aplicáveis, existe uma opção de **crossing-over** que mostra resultados alternativos considerando recombinação genética (Passepartout).

### 4.5 Resultados

Os resultados são apresentados em:
- **Tabela de machos** — Mutações possíveis e porcentagens
- **Tabela de fêmeas** — Mutações possíveis e porcentagens
- **Badges coloridos** — Identificação visual rápida de cada mutação

### 4.6 Integração com Filhotes

O módulo de Filhotes utiliza a mesma base genética do simulador para exibir as mutações esperadas dos filhotes com base nos pais cadastrados.

---

## 5. Gerenciamento de Pagamentos

### 5.1 Fluxo de pagamento

Quando um usuário contrata um plano, o seguinte fluxo acontece:

```
Usuário escolhe plano → Checkout MercadoPago → Pagamento → Webhook notifica backend → Acesso liberado
```

Se o pagamento for por PIX ou manual, pode ser necessária **aprovação manual** pelo proprietário.

### 5.2 Status de pagamento

| Status | Significado | Ação necessária |
|--------|-------------|-----------------|
| **redirect_pending** | Usuário foi redirecionado ao MercadoPago | Aguardar conclusão |
| **awaiting_payment** | Checkout criado, aguardando pagamento | Aguardar ou entrar em contato |
| **processing** | Pagamento em análise pelo gateway | Aguardar confirmação |
| **paid** | Pagamento confirmado | Nenhuma — acesso já liberado |
| **rejected** | Pagamento recusado | Informar o usuário |

### 5.3 Aprovando um pagamento manualmente

1. No Painel do Proprietário, selecione o assinante
2. Localize o pagamento pendente no histórico
3. Clique em **"Aprovar"**
4. O sistema marca como **paid** e libera o acesso automaticamente

### 5.4 Rejeitando um pagamento

1. Selecione o assinante
2. Localize o pagamento
3. Clique em **"Rejeitar"**
4. O status muda para **past_due** e o acesso permanece bloqueado

---

## 6. Controle de Acesso dos Usuários

### 6.1 Ações disponíveis

Para cada assinante selecionado, você pode executar:

| Ação | Descrição |
|------|-----------|
| **Conceder Acesso** | Libera acesso com plano específico (Mensal, Anual ou Vitalício) |
| **Aprovar Pagamento** | Confirma pagamento pendente e libera acesso |
| **Rejeitar Pagamento** | Recusa pagamento e mantém acesso bloqueado |
| **Estender Trial** | Adiciona mais 7 dias ao período de teste |
| **Revogar Acesso** | Cancela assinatura ativa e bloqueia acesso |

### 6.2 Concedendo acesso manual

1. Selecione o assinante na lista
2. Clique em **"Conceder Acesso"**
3. Escolha o plano:
   - **Mensal** — 30 dias de acesso
   - **Anual** — 365 dias de acesso
   - **Vitalício** — Acesso permanente
4. Confirme a ação

Isso é útil para:
- Cortesia para parceiros
- Compensação por problemas
- Testes internos

### 6.3 Estendendo o período de teste

1. Selecione o assinante em trial
2. Clique em **"Estender Trial"**
3. O sistema adiciona **7 dias** ao período atual

### 6.4 Revogando acesso

1. Selecione o assinante ativo
2. Clique em **"Revogar Acesso"**
3. Confirme a ação
4. O usuário perde acesso imediatamente e só vê Assinatura e Configurações

---

## 7. Todos os Módulos Operacionais

Como proprietário, você tem acesso a todos os módulos descritos no Manual do Usuário. Resumo rápido:

| Módulo | Finalidade |
|--------|-----------|
| **Plantel** | Gestão de aves ativas — cadastro, edição, busca |
| **Aves em Choco** | Ciclos reprodutivos — casais, posturas, previsões |
| **Gaiolas** | Gaiolas do criatório — capacidade, ocupação, manutenção |
| **Filhotes** | Nascimentos — desenvolvimento, anelamento, promoção ao plantel |
| **Espécies** | Catálogo taxonômico — dados científicos e de conservação |
| **Criatórios** | Espaços físicos — temperatura, umidade, capacidade |
| **Anéis** | Anilhas — IBAMA, FOB, criadouro, disponibilidade |
| **Financeiro** | Receitas e despesas — vendas, compras, controle fiscal |
| **Ex-Plantel** | Aves que saíram — motivo, destinatário, valor |
| **Mutações** | Simulador genético — 51 cenários de cruzamento |
| **Assinatura** | Seu plano (Vitalício) |
| **Proprietário** | Painel administrativo |
| **Configurações** | Personalização de cores do sistema |

Para detalhes completos de cada módulo, consulte o **Manual do Usuário**.

---

## 8. Configuração Técnica do Backend

### 8.1 Infraestrutura

| Componente | Serviço | URL |
|-----------|---------|-----|
| Frontend | GitHub Pages | https://andersonassissouza.github.io/gestao-criatorio |
| Backend | Vercel Serverless | https://backend-seven-gamma-36.vercel.app |
| Banco de Dados | Neon PostgreSQL | Conexão via DATABASE_URL |
| Pagamentos | MercadoPago | API de Preferências/Checkout |

### 8.2 Variáveis de ambiente do Backend

As principais variáveis configuradas na Vercel:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão do Neon PostgreSQL |
| `DATABASE_SSL` | Habilita SSL na conexão (true) |
| `JWT_SECRET` | Chave secreta para assinatura de tokens JWT |
| `JWT_EXPIRES_IN` | Duração do token (24h) |
| `JWT_ISSUER` | Emissor do JWT (plumar-api) |
| `JWT_AUDIENCE` | Audiência do JWT (plumar-web) |
| `OWNER_EMAILS` | E-mails do proprietário (separados por vírgula) |
| `OWNER_NAME` | Nome do proprietário |
| `OWNER_PASSWORD` | Senha do proprietário |
| `OWNER_ACCESS_KEY` | Chave de acesso do proprietário |
| `FRONTEND_URL` | URL do frontend para CORS |
| `FRONTEND_PUBLIC_URL` | URL pública do frontend |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de produção do MercadoPago |
| `NODE_ENV` | Ambiente (production) |

### 8.3 Endpoints da API

**Autenticação:**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/forgot-password` | Solicitar recuperação de senha |
| POST | `/api/auth/reset-password` | Redefinir senha |

**Módulos (mesmo padrão para todos):**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/{modulo}/list` | Listar registros |
| POST | `/api/{modulo}/create` | Criar registro |
| PUT | `/api/{modulo}/:id` | Atualizar registro |
| DELETE | `/api/{modulo}/:id` | Excluir registro |

*Módulos: plantel, filhotes, gaiolas, chocando, financeiro, especies, criatorios, aneis, ovos, ninhadas, listaItens, explantel*

**Acesso e Assinatura:**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/access/my-access` | Status do acesso do usuário |
| POST | `/api/access/create-checkout` | Criar checkout MercadoPago |
| POST | `/api/access/reconcile-checkout` | Verificar status do pagamento |
| GET | `/api/access/list-subscribers` | Listar assinantes (owner) |
| POST | `/api/access/grant-access` | Conceder acesso (owner) |
| POST | `/api/access/approve-payment` | Aprovar pagamento (owner) |
| POST | `/api/access/reject-payment` | Rejeitar pagamento (owner) |
| POST | `/api/access/revoke-access` | Revogar acesso (owner) |

### 8.4 Webhook do MercadoPago

O endpoint para receber notificações automáticas de pagamento é:
```
https://backend-seven-gamma-36.vercel.app/api/payments/mercadopago/webhook
```

Este URL deve ser cadastrado no painel de desenvolvedor do MercadoPago para que os pagamentos sejam confirmados automaticamente.

---

## 9. Fluxo Completo de um Novo Assinante

### Passo a passo do que acontece quando um novo usuário se cadastra:

```
1. Usuário acessa o sistema e clica em "Criar conta"
         │
2. Preenche nome, e-mail e senha
         │
3. Sistema cria a conta com role="user" e trial de 7 dias
         │
4. Usuário tem acesso a todos os módulos operacionais por 7 dias
         │
5. No Painel do Proprietário, o card "Trial" incrementa
         │
    ┌─────────┴─────────┐
    │                    │
6a. Trial expira      6b. Usuário contrata plano
    │                    │
    │               7. Redireciona ao MercadoPago
    │                    │
    │               8. Pagamento confirmado
    │                    │
    │               9. Acesso liberado automaticamente
    │                    │
    ▼                    ▼
Perde acesso         Acesso ativo
(só Assinatura)      (todos os módulos)
```

### Cenários de intervenção manual:

- **Pagamento PIX não confirmado automaticamente**: Aprovar manualmente no Painel do Proprietário
- **Usuário precisa de mais tempo de teste**: Estender trial (+7 dias)
- **Parceiro ou cortesia**: Conceder acesso Vitalício diretamente
- **Problema com assinante**: Revogar acesso

---

## 10. Resolução de Problemas

### 10.1 Usuário não consegue fazer login

**Causa provável:** E-mail ou senha incorretos.
**Solução:** Orientar o usuário a usar "Esqueci minha senha" para redefinir.

### 10.2 Usuário não vê os módulos operacionais

**Causa provável:** Assinatura expirada ou trial encerrado.
**Solução:**
1. Acesse o Painel do Proprietário
2. Selecione o usuário
3. Verifique o status e a data de expiração
4. Se necessário, conceda acesso ou estenda o trial

### 10.3 Pagamento aparece como pendente

**Causa provável:** Webhook do MercadoPago não processou ou pagamento PIX não confirmado.
**Solução:**
1. Verifique no painel do MercadoPago se o pagamento foi recebido
2. Se confirmado, aprove manualmente no Painel do Proprietário
3. Se não recebido, peça ao usuário que tente novamente

### 10.4 Dados do sistema aparecem vazios

**Causa provável:** Primeiro acesso ou banco de dados sem dados iniciais.
**Solução:** Comece cadastrando espécies e gaiolas primeiro, depois popule o plantel.

### 10.5 Erro 401 (não autorizado)

**Causa provável:** Token JWT expirado (expira em 24h).
**Solução:** Fazer logout e login novamente.

### 10.6 Cores do sistema estão diferentes

**Causa provável:** Configurações de tema salvas no navegador.
**Solução:** Acesse Configurações e clique em "Restaurar padrão".

### 10.7 Sistema lento no primeiro acesso

**Causa provável:** Cold start do Vercel Serverless (após inatividade).
**Solução:** É normal. O primeiro request pode demorar 3-5 segundos. Os subsequentes são rápidos.

---

## Resumo de Acesso Rápido

| Preciso... | Onde acessar |
|-----------|-------------|
| Ver meus assinantes | Proprietário → Lista de assinantes |
| Aprovar um pagamento | Proprietário → Selecionar usuário → Aprovar |
| Liberar acesso gratuito | Proprietário → Selecionar usuário → Conceder Acesso |
| Simular cruzamento genético | Mutações → Selecionar macho e fêmea |
| Ver receitas e despesas | Financeiro |
| Cadastrar nova ave | Plantel → Botão "+" |
| Personalizar cores | Configurações |
| Ver status dos pagamentos | Proprietário → Cards no topo |

---

*PLUMAR — A plataforma que organiza o criatório com visão, rastreabilidade e performance.*
