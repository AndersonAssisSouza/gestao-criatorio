# PLUMAR — Manual do Usuário

**Gestão inteligente para criatórios**
*Plumagem, genética e manejo em um só sistema*

---

## Sumário

1. [Primeiros Passos](#1-primeiros-passos)
2. [Navegação e Interface](#2-navegação-e-interface)
3. [Plantel — Aves Ativas](#3-plantel--aves-ativas)
4. [Aves em Choco — Ciclos Reprodutivos](#4-aves-em-choco--ciclos-reprodutivos)
5. [Gaiolas — Gestão de Gaiolas](#5-gaiolas--gestão-de-gaiolas)
6. [Filhotes — Nascimentos e Desenvolvimento](#6-filhotes--nascimentos-e-desenvolvimento)
7. [Espécies — Catálogo Taxonômico](#7-espécies--catálogo-taxonômico)
8. [Criatórios — Espaços Físicos](#8-criatórios--espaços-físicos)
9. [Anéis — Controle de Anilhas](#9-anéis--controle-de-anilhas)
10. [Financeiro — Receitas e Despesas](#10-financeiro--receitas-e-despesas)
11. [Ex-Plantel — Aves que Saíram](#11-ex-plantel--aves-que-saíram)
12. [Assinatura — Planos e Pagamento](#12-assinatura--planos-e-pagamento)
13. [Configurações — Personalização Visual](#13-configurações--personalização-visual)
14. [Perguntas Frequentes](#14-perguntas-frequentes)

---

## 1. Primeiros Passos

### 1.1 Criando sua conta

1. Acesse o sistema em **https://andersonassissouza.github.io/gestao-criatorio**
2. Clique em **"Criar conta"**
3. Preencha os campos:
   - **Nome** (mínimo 3, máximo 80 caracteres)
   - **E-mail** (deve ser um e-mail válido)
   - **Senha** (mínimo 8 caracteres, contendo letras e números)
4. Clique em **"Criar conta e entrar"**

Ao criar sua conta, você recebe automaticamente **30 dias gratuitos** para testar todas as funcionalidades do sistema.

### 1.2 Fazendo login

1. Informe seu **e-mail** e **senha**
2. Clique em **"Entrar"**

### 1.3 Esqueci minha senha

1. Na tela de login, clique em **"Esqueci minha senha"**
2. Informe o e-mail cadastrado
3. Clique em **"Enviar instruções"**
4. Verifique seu e-mail e clique no link de recuperação
5. Defina uma nova senha (mínimo 8 caracteres com letras e números)
6. Confirme a nova senha
7. Clique em **"Salvar nova senha"**

O link de recuperação expira em **60 minutos**. Se expirar, solicite um novo.

---

## 2. Navegação e Interface

### 2.1 Barra lateral (Sidebar)

A barra lateral é o menu principal do sistema, organizado em grupos:

| Grupo | Módulos |
|-------|---------|
| **Manejo** | Plantel, Aves em Choco, Gaiolas, Filhotes |
| **Cadastros** | Espécies, Criatórios, Anéis |
| **Análise** | Financeiro, Ex-Plantel |
| **Sistema** | Assinatura, Configurações |

No rodapé da barra lateral, você verá seu **avatar** (iniciais do nome), seu **nome**, o **status da assinatura** e o botão de **sair**.

### 2.2 Período de teste

Durante o período de teste gratuito (30 dias), você tem acesso a todos os módulos operacionais. Quando o teste expirar, será necessário contratar um plano para continuar usando o sistema. Enquanto sem assinatura ativa, apenas os módulos **Assinatura** e **Configurações** ficam disponíveis.

### 2.3 Navegação em dispositivos móveis

No celular, a barra lateral é substituída por uma **barra de navegação inferior** (dock) com ícones. Toque no ícone de menu para abrir a barra lateral completa.

### 2.4 Formulários

Todos os módulos de cadastro seguem o mesmo padrão:
- Clique no botão **"+"** ou **"Novo"** para abrir o formulário
- Preencha os campos obrigatórios (marcados com *)
- Clique em **"Salvar"** para confirmar ou **"Cancelar"** para descartar
- Para **editar**, clique no botão de edição na linha da tabela
- Para **excluir**, clique no botão de exclusão (ícone de lixeira)

---

## 3. Plantel — Aves Ativas

O módulo Plantel é o coração do sistema. Aqui você gerencia todas as aves ativas do seu criatório.

### 3.1 Painel de estatísticas

No topo do módulo, você encontra cards com:
- **Total de aves** (somente vivas)
- **Machos** (quantidade)
- **Fêmeas** (quantidade)
- **Gaiolas ativas** (quantidade em uso)

### 3.2 Cadastrando uma ave

Clique no botão **"+"** e preencha:

| Campo | Descrição | Obrigatório |
|-------|-----------|:-----------:|
| Nome | Nome da ave | Sim |
| Categoria | Canário, Pintassilgo, Tarin, Coleiro ou Outro | Não |
| Gênero | Macho, Fêmea ou Indeterminado | Não |
| Status | Ativo, Chocando ou Inativo | Não |
| Gaiola | Código da gaiola onde a ave está | Não |
| Nome da Mãe | Nome da mãe (se conhecida) | Não |
| Nome do Pai | Nome do pai (se conhecido) | Não |
| Data de Nascimento | Data de nascimento ou estimativa | Não |
| Origem | Nascido no criatório, Adquirida, Adquirido ou Doação | Não |
| Registro FOB | Número do registro na FOB | Não |
| Anel Esquerdo | Identificação do anel/anilha | Não |

### 3.3 Tabela do plantel

A tabela exibe as seguintes colunas:
- **Nome** (destaque visual)
- **Categoria** (espécie)
- **Status** (badge colorido)
- **Gênero**
- **Gaiola**
- **Data Nasc.**
- **Ações** (editar e remover)

### 3.4 Busca

Use o campo de busca no topo para filtrar aves pelo nome. A busca não diferencia maiúsculas de minúsculas.

---

## 4. Aves em Choco — Ciclos Reprodutivos

Monitore casais em reprodução, posturas e o andamento dos ciclos de choco.

### 4.1 Cadastrando um ciclo de choco

| Campo | Descrição |
|-------|-----------|
| Nome da Ave | Nome da ave em choco |
| Categoria | Espécie da ave |
| Gaiola | Gaiola do casal |
| Data de Início | Quando o choco começou |
| Previsão Eclosão | Data prevista para eclosão dos ovos |
| Quantidade de Ovos | Total de ovos na postura |
| Ovos Férteis | Quantos ovos são férteis |
| Status | Em Choco, Eclodido ou Abandonado |
| Observações | Anotações sobre o ciclo |

### 4.2 Status do ciclo

- **Em Choco** — A ave está chocando os ovos
- **Eclodido** — Os ovos eclodiram com sucesso
- **Abandonado** — O ninho foi abandonado

### 4.3 Tempo de choco por espécie

O sistema sugere automaticamente tempos de incubação:
- **Tarin**: 13 dias
- **Canário Belga**: 13 dias

---

## 5. Gaiolas — Gestão de Gaiolas

Gerencie todas as gaiolas do criatório, suas capacidades e ocupações.

### 5.1 Cadastrando uma gaiola

| Campo | Descrição |
|-------|-----------|
| Código da Gaiola | Identificação única (ex: 001, 002) |
| Tipo | Voo, Choco, Reprodução ou Exposição |
| Localização | Onde a gaiola está no criatório |
| Capacidade | Número máximo de aves |
| Ocupação Atual | Quantas aves estão na gaiola |
| Status | Disponível, Ocupada ou Manutenção |
| Última Limpeza | Data da última higienização |
| Aves Residentes | Lista de aves na gaiola |
| Observações | Anotações adicionais |

### 5.2 Status da gaiola

- **Disponível** — Vazia e pronta para uso
- **Ocupada** — Com aves alocadas
- **Manutenção** — Em limpeza ou reparo

### 5.3 Status detalhados

As gaiolas também podem exibir status específicos do manejo:
- Chocando, Vazia, Preparação, Dividida, Com Ave Avulsa, Com Duas Aves Separadas, Acasalando

---

## 6. Filhotes — Nascimentos e Desenvolvimento

Acompanhe filhotes desde o nascimento até a introdução no plantel.

### 6.1 Cadastrando um filhote

| Campo | Descrição |
|-------|-----------|
| Nome / ID Temporário | Identificação do filhote |
| Categoria | Espécie |
| Status | Em Desenvolvimento, Desmamado, Transferido para Plantel ou Óbito |
| Data de Nascimento | Data de nascimento |
| Gaiola | Gaiola atual |
| Nome da Mãe | Mãe do filhote |
| Nome do Pai | Pai do filhote |
| Anelamento | Informação da anilha |
| Peso (g) | Peso em gramas |
| Destino | Plantel, Venda, Doação ou não definido |
| Observações | Anotações sobre o filhote |

### 6.2 Ciclo de vida do filhote

1. **Em Desenvolvimento** — Filhote recém-nascido, ainda no ninho
2. **Desmamado** — Já come sozinho, independente dos pais
3. **Transferido para Plantel** — Promovido ao plantel (ficha movida automaticamente)
4. **Óbito** — Registro de falecimento

### 6.3 Informações genéticas

O módulo exibe badges coloridos com as mutações esperadas dos filhotes, calculadas automaticamente com base nas mutações dos pais (usando a base de cruzamentos genéticos do sistema).

---

## 7. Espécies — Catálogo Taxonômico

Mantenha um catálogo organizado de todas as espécies do criatório.

### 7.1 Cadastrando uma espécie

| Campo | Descrição |
|-------|-----------|
| Nome Comum | Nome popular (ex: Tarin) |
| Nome Científico | Classificação científica (ex: Spinus cucullatus) |
| Família | Família taxonômica |
| Cor Predominante | Coloração principal |
| Qtd. no Plantel | Quantidade de aves dessa espécie |
| Tamanho Médio (cm) | Comprimento médio em centímetros |
| Dieta Principal | Granívora, Onívora, Frugívora ou Insetívora |
| Status Conservação | Comum, Quase Ameaçada ou Vulnerável |
| Observações | Informações adicionais |

---

## 8. Criatórios — Espaços Físicos

Gerencie os espaços físicos de reprodução e suas condições ambientais.

### 8.1 Cadastrando um espaço

| Campo | Descrição |
|-------|-----------|
| Nome do Espaço | Identificação do espaço |
| Tipo | Sala Interna, Viveiro Externo ou Quarentena |
| Área (m²) | Metragem do espaço |
| Capacidade de Gaiolas | Máximo de gaiolas |
| Gaiolas Instaladas | Gaiolas atualmente instaladas |
| Temperatura Média (°C) | Temperatura do ambiente |
| Umidade Média (%) | Umidade relativa |
| Iluminação | Natural, Artificial ou Mista |
| Status | Ativo, Inativo ou Reforma |
| Última Manutenção | Data da última manutenção |
| Observações | Notas sobre o espaço |

---

## 9. Anéis — Controle de Anilhas

Rastreie todas as anilhas do criatório e sua disponibilidade.

### 9.1 Cadastrando um anel

| Campo | Descrição |
|-------|-----------|
| Código do Anel | Identificação única |
| Tipo | IBAMA, FOB ou Criadouro |
| Diâmetro (mm) | Tamanho da anilha |
| Cor | Cor da anilha |
| Ave Associada | Ave que está usando o anel |
| Data de Colocação | Quando foi colocado |
| Lote | Número do lote |
| Status | Utilizado, Disponível ou Extraviado |
| Observações | Notas adicionais |

### 9.2 Status do anel

- **Utilizado** — Colocado em uma ave
- **Disponível** — Pronto para uso
- **Extraviado** — Perdido ou não localizado

---

## 10. Financeiro — Receitas e Despesas

Controle completo de todas as movimentações financeiras do criatório.

### 10.1 Registrando uma transação

| Campo | Descrição |
|-------|-----------|
| Descrição | Detalhamento da transação |
| Tipo | Receita (entrada) ou Despesa (saída) |
| Categoria | Venda de Ave, Ração, Medicamento, Equipamento, Anéis, Manutenção ou Outros |
| Valor (R$) | Valor da transação |
| Data | Data da movimentação |
| Forma de Pagamento | Dinheiro, PIX, Cartão ou Transferência |
| Status | Pago, Pendente ou Cancelado |
| Ave Relacionada | Ave vinculada à transação (opcional) |
| Nota Fiscal | Número do documento fiscal (opcional) |
| Observações | Notas sobre a transação |

### 10.2 Visualização

Na tabela, as transações são diferenciadas visualmente:
- **Receitas** aparecem em **verde** com prefixo **+**
- **Despesas** aparecem em **vermelho** com prefixo **-**
- Valores formatados como moeda brasileira (R$)

---

## 11. Ex-Plantel — Aves que Saíram

Registre e consulte aves que saíram do criatório.

### 11.1 Cadastrando uma saída

| Campo | Descrição |
|-------|-----------|
| Nome | Nome da ave |
| Categoria | Espécie |
| Gênero | Macho, Fêmea ou Indeterminado |
| Motivo da Saída | Venda, Doação, Óbito, Fuga ou Outro |
| Data de Saída | Data em que a ave saiu |
| Destinatário | Para quem foi a ave (se venda/doação) |
| Valor (R$) | Valor da venda (se aplicável) |
| Registro FOB | Número do registro |
| Anel Esquerdo | Identificação do anel |
| Última Gaiola | Última gaiola antes da saída |
| Observações | Detalhes sobre a saída |

---

## 12. Assinatura — Planos e Pagamento

### 12.1 Planos disponíveis

| Plano | Valor | Duração |
|-------|-------|---------|
| **Mensal** | R$ 29,90 | 30 dias (renovação automática) |
| **Anual** | R$ 299,00 | 12 meses |

### 12.2 Painel de status

No topo do módulo, você encontra:
- **Status** — Se o acesso está liberado ou bloqueado
- **Plano** — Qual plano está ativo
- **Válido até** — Data de expiração (ou dias restantes do teste)

### 12.3 Como assinar

1. Acesse o módulo **Assinatura**
2. Escolha entre **Mensal** ou **Anual**
3. Selecione a forma de pagamento:
   - **PIX** — Gera QR code para pagamento instantâneo
   - **Cartão** — Preencha os dados do cartão
4. Clique em **"Assinar"** ou **"Pagar via MercadoPago"**
5. Se redirecionado ao MercadoPago, conclua o pagamento na plataforma
6. Ao retornar, o sistema verifica automaticamente o status do pagamento

### 12.4 Status do pagamento

- **Aguardando pagamento** — Checkout criado, pagamento pendente
- **Processando** — Pagamento em análise
- **Pago** — Confirmado, acesso liberado
- **Rejeitado** — Pagamento recusado

### 12.5 Histórico de pagamentos

A tabela de histórico exibe:
- Status do pagamento
- Método utilizado
- Valor
- Data

---

## 13. Configurações — Personalização Visual

Personalize as cores do sistema de acordo com a sua preferência.

### 13.1 Cores personalizáveis

| Configuração | Descrição | Padrão |
|-------------|-----------|--------|
| Cor principal | Botões, destaques e indicadores | Laranja queimado |
| Gradiente da marca | Profundidade de botões | Laranja escuro |
| Cor de apoio | Tom complementar secundário | Verde suave |
| Fundo principal | Fundo de toda a aplicação | Bege claro |
| Fundo profundo | Camadas de sombra | Bege mais claro |
| Painéis e cards | Sidebar, cartões e superfícies | Branco off-white |

### 13.2 Como personalizar

1. Acesse **Configurações** no menu lateral
2. Clique no seletor de cor (quadrado colorido) ao lado de cada item
3. Escolha a cor desejada no seletor ou digite o código hexadecimal
4. A pré-visualização ao lado atualiza em tempo real
5. As cores são salvas automaticamente no seu navegador

### 13.3 Restaurar padrão

Clique no botão **"Restaurar padrão"** para voltar às cores originais do sistema.

---

## 14. Perguntas Frequentes

**P: O que acontece quando meu período de teste acaba?**
R: Você perde acesso aos módulos operacionais e só consegue acessar Assinatura e Configurações. Contrate um plano para retomar o acesso.

**P: Posso mudar minha senha?**
R: Sim. Na tela de login, clique em "Esqueci minha senha" e siga o processo de recuperação.

**P: Minhas configurações de cores são salvas na nuvem?**
R: Não. As cores são salvas localmente no seu navegador. Se trocar de navegador ou dispositivo, precisará configurar novamente.

**P: Posso acessar de vários dispositivos?**
R: Sim. Basta fazer login com seu e-mail e senha em qualquer navegador.

**P: O que é o Registro FOB?**
R: É o número de registro na Federação Ornitológica do Brasil, entidade que regulamenta criatórios de aves no país.

**P: O que são as categorias IBAMA, FOB e Criadouro nos anéis?**
R: São os tipos de anilha — IBAMA (governamental), FOB (federação) e Criadouro (emitida pelo próprio criador).

**P: Como funciona o pagamento via MercadoPago?**
R: Ao selecionar PIX ou Cartão, você é redirecionado para a plataforma segura do MercadoPago para concluir o pagamento. Após a conclusão, retorna automaticamente ao sistema.

---

*PLUMAR — A plataforma que organiza o criatório com visão, rastreabilidade e performance.*
