# PLUMAR — Guia de Execução da Campanha de Lançamento
## Checklist Operacional — Abril 2026

---

## STATUS ATUAL

| Entregável | Status |
|---|---|
| Landing page integrada ao frontend | PRONTO — componente React criado, build OK |
| Pack de posts para redes sociais (14 peças) | PRONTO — arquivo PLUMAR_Posts_Redes_Sociais.md |
| Sequência de 10 emails (3 fluxos) | PRONTO — arquivo PLUMAR_Sequencia_Emails.md |
| Plano estratégico de marketing (DOCX) | PRONTO — arquivo PLUMAR_Plano_Marketing.docx |
| Apresentação comercial (PPTX) | PRONTO — 10 slides |
| Landing page HTML standalone | PRONTO — arquivo PLUMAR_Landing_Page.html |

---

## 1. DEPLOY DA LANDING PAGE

A landing page já está integrada ao frontend do PLUMAR como componente React. Ela aparece automaticamente para visitantes não autenticados.

**Para colocar no ar:**

1. Faça deploy normalmente do frontend (mesmo processo que já usa)
2. O fluxo agora é: **Landing Page → Botão "Entrar" → Tela de Login → Dashboard**
3. O botão "Teste Grátis por 7 Dias" na landing page rola até a seção de CTA
4. O botão "Criar Conta Grátis" leva direto para a tela de login/registro

**Arquivos modificados:**
- `frontend/src/App.jsx` — AppRouter agora mostra LandingPage por padrão
- `frontend/src/components/auth/LoginPage.jsx` — Adicionado botão "Voltar para a página inicial"
- `frontend/src/components/landing/LandingPage.jsx` — **NOVO** componente da landing page
- `frontend/src/components/landing/LandingPage.css` — **NOVO** estilos usando design tokens existentes

**Teste local:**
```bash
cd frontend
npm run dev
# Acesse http://localhost:3000 — deve ver a landing page
# Clique "Entrar" — deve ver a tela de login com botão de voltar
```

---

## 2. CRIAÇÃO DOS PERFIS SOCIAIS

### Instagram — @plumar.app (ou @plumar.oficial)

**Criar conta Business:**
1. Baixe o Instagram → Criar nova conta
2. Nome: PLUMAR
3. Username: @plumar.app (ou @plumar.oficial se indisponível)
4. Converta para conta Profissional → Categoria: "Software"

**Configurar perfil:**
- **Nome de exibição:** PLUMAR | Gestão de Criatório
- **Bio:**
  ```
  🐦 Sistema de gestão para criadores de aves
  🧬 Simulador genético exclusivo
  📋 Plantel • Anilhas • Reprodução • Finanças
  ⬇️ Teste grátis 7 dias
  ```
- **Link na bio:** URL do PLUMAR (landing page)
- **Foto de perfil:** Logo PLUMAR (fundo escuro, texto claro)
- **Destaques dos Stories:** "Sobre", "Funções", "Tutorial", "Depoimentos"

### Facebook — Página PLUMAR

1. Criar Página → Categoria: "Software" ou "Aplicativo"
2. Nome: PLUMAR — Gestão de Criatório
3. Sobre: "O primeiro sistema de gestão de criatório com simulador genético integrado. Controle plantel, genética, anilhas, reprodução e finanças. Teste grátis por 7 dias."
4. CTA Button: "Cadastre-se" → link para landing page
5. Foto de capa: Banner com tagline "Crie com inteligência. Crie com PLUMAR."

**Grupos para entrar e postar (Facebook):**
- Criadores de Canários (vários por estado)
- Criadores de Calopsitas Brasil
- Agapornis Brasil
- Criadores de Aves Silvestres
- SISPASS — Criadores Legalizados
- Ringneck Brasil
- Criadores de Curiós e Bicudos

### YouTube — PLUMAR

1. Criar canal → Nome: PLUMAR - Gestão de Criatório
2. Banner: Mesmo visual da capa do Facebook
3. Sobre: Mesma descrição do Facebook + link para landing page
4. Playlists iniciais: "Tutoriais", "Demos", "Dicas de Manejo"

**Primeiro vídeo (prioritário):**
- "Conheça o PLUMAR: tour completo pelo sistema" (5-8 min)
- Screen recording com narração
- Roteiro: Cadastro → Plantel → Simulador Genético → Gaiolas → Anilhas → Financeiro

---

## 3. EMAIL MARKETING — RECOMENDAÇÃO

### Ferramenta recomendada: Power Automate + Outlook

Dado que você já domina o ecossistema Microsoft e o backend do PLUMAR usa SharePoint/Graph API, a recomendação é:

**Opção A — Power Automate (recomendada):**
- Criar fluxos automatizados que disparam emails via Outlook
- Trigger: quando novo usuário é criado no sistema (via API/webhook)
- Vantagem: sem custo adicional, integração nativa com MS365
- Templates dos emails já estão prontos em PLUMAR_Sequencia_Emails.md

**Implementação:**
1. Criar fluxo "Onboarding — Boas-vindas" → trigger: novo registro → envia Email 1
2. Criar fluxo "Onboarding — Dia 2" → trigger: 2 dias após registro → envia Email 2
3. Repetir para cada email da sequência
4. Fluxo "Trial Expirando" → trigger: 6 dias após registro → envia Email 5

**Opção B — Brevo (grátis até 300 emails/dia):**
- Se preferir plataforma dedicada com templates visuais e analytics
- Cadastro em brevo.com → Plano gratuito
- Importar contatos → Criar automações → Colar copy dos emails

---

## 4. CALENDÁRIO DE EXECUÇÃO — SEMANA 1

| Dia | Ação | Responsável | Status |
|-----|------|-------------|--------|
| Dia 1 | Deploy landing page + Criar perfil Instagram | Anderson | ⬜ |
| Dia 1 | Criar página Facebook + Canal YouTube | Anderson | ⬜ |
| Dia 1 | Publicar Post 1 (Teaser) no Instagram e Facebook | Anderson | ⬜ |
| Dia 2 | Publicar Post 2 (segundo teaser) | Anderson | ⬜ |
| Dia 3 | Publicar Reel "5 Problemas" (Post 2 do pack) | Anderson | ⬜ |
| Dia 4 | Publicar Carrossel Genética (Post 3) | Anderson | ⬜ |
| Dia 5 | Stories Interativos (Post 4) | Anderson | ⬜ |
| Dia 5 | Configurar fluxo de email de boas-vindas | Anderson | ⬜ |
| Dia 6 | REVEAL — Post oficial de lançamento (Post 5) | Anderson | ⬜ |
| Dia 6 | Primeira postagem nos grupos Facebook | Anderson | ⬜ |
| Dia 7 | Primeira mensagem nos grupos WhatsApp | Anderson | ⬜ |

---

## 5. MÉTRICAS PARA ACOMPANHAR

**Semanalmente:**
- Novos seguidores Instagram
- Alcance e engajamento dos posts (curtidas, comentários, shares, saves)
- Visitas na landing page (Google Analytics ou equivalente)
- Cadastros no trial
- Taxa de ativação (cadastrou 10+ aves em 48h)

**Mensalmente:**
- Conversão trial → pago
- Taxa de abertura de emails
- Taxa de clique nos emails
- Custo por aquisição (se adicionar ads no futuro)
- NPS ou feedback qualitativo dos usuários

---

## 6. GRUPOS DE WHATSAPP — ESTRATÉGIA DE ENTRADA

**Regras de ouro:**
1. NUNCA entre em um grupo e poste propaganda direto. Participe por 2-3 dias primeiro.
2. Contribua com valor: responda dúvidas sobre genética, manejo, legislação.
3. Só depois compartilhe o PLUMAR como "ferramenta que eu desenvolvi e uso".
4. Envie o link junto com uma dica útil, não como propaganda solta.
5. Use as mensagens prontas do pack (seção WhatsApp) como base, adaptando ao contexto.

**Onde encontrar grupos:**
- Busque no Google: "grupo whatsapp criadores [espécie] [estado]"
- Pergunte em grupos do Facebook por links de WhatsApp
- Associações e clubes de criadores geralmente têm grupos
- Perfis de criadores no Instagram frequentemente divulgam links

---

## 7. SEO — AÇÕES IMEDIATAS

Se o PLUMAR terá domínio próprio (plumar.com.br ou similar):

1. **Meta tags na landing page** — já incluídas no componente React (title + description)
2. **Google Search Console** — registrar domínio assim que tiver
3. **Google Business Profile** — criar perfil como "Software"
4. **Primeiro artigo de blog** (mês 1): "Guia Completo de Gestão de Criatório de Aves"
   - Alvo de keyword: "gestão de criatório", "controle de plantel de aves", "sistema para criadores"

---

## RESUMO: PRIMEIRAS 72 HORAS

1. ✅ Deploy do frontend com landing page
2. ✅ Criar perfil Instagram + Página Facebook + Canal YouTube
3. ✅ Publicar primeiro post teaser
4. ✅ Configurar fluxo de email de boas-vindas (Power Automate)
5. ✅ Entrar em 3-5 grupos de WhatsApp de criadores (sem postar ainda)
6. ✅ Publicar Reel "5 Problemas" no dia 3

Se essas 6 ações forem executadas nas primeiras 72 horas, o funil já está rodando.
