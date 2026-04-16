# CRONOGRAMA OFICIAL DE PUBLICAÇÕES — PLUMAR

**Gerado em:** 2026-04-16
**Campanha:** Lançamento PLUMAR — Abril/Maio 2026
**Responsável:** Anderson Assis
**Fuso:** America/Sao_Paulo (BRT)

---

## STATUS ATUAL

| # | Status | Data de Publicação | Observação |
|---|--------|--------------------|------------|
| Post 1 | Publicado | 2026-04-15 | Teaser Instagram+Facebook |
| Post 5 | Publicado | 2026-04-15 | Reveal Oficial |
| Post 8 | Publicado | 2026-04-15 | Grupos Facebook |
| Post 2 | **ATRASADO** | 2026-04-17 07:30 (reagendado) | Reel "5 Problemas" |
| Post 3 | Programado | 2026-04-19 11:00 | Carrossel Genética |
| Post 4 | Programado | 2026-04-20 19:00 | Stories Interativos |
| Post 6 | Programado | 2026-04-22 19:30 | Reel Simulador |
| Post 7 | Programado | 2026-04-24 12:30 | Carrossel Antes/Depois |
| Post 9 | Programado | 2026-04-26 11:00 | Carrossel Tutorial |
| Post 10 | Programado | 2026-04-28 19:00 | Reel 3 Funcionalidades |
| Post 11 | Programado | 2026-04-30 08:00 | Dica Manejo |
| Post 12 | Programado | 2026-05-02 11:00 | Carrossel 5 Motivos |
| Post 13 | Programado | 2026-05-04 19:30 | Reel Depoimento |
| Post 14 | Programado | 2026-05-06 20:00 | Urgência/Escassez |

---

## CRITÉRIOS DO CRONOGRAMA

**Cadência:** 2 a 3 dias entre posts (11 posts em 20 dias = campanha de ~3 semanas).

**Horários por formato:**
- **Reels (vídeo curto):** 19:00–19:30 (pico de engajamento noturno em hobbies no Brasil).
- **Carrosséis educativos:** manhã de fim de semana (11:00) ou almoço de dia útil (12:30).
- **Imagem estática/dica rápida:** manhã (07:30–08:00), para captar na pausa do café.
- **Stories:** 19:00 (stories são descartáveis em 24h, postar perto do pico).

**Mix de formatos evita saturação:**
- Reel → Carrossel → Stories → Reel → Carrossel → ...
- Entre dois reels há sempre um carrossel ou estático.

**Distribuição por plataforma:**
- Todos os reels e carrosséis: Instagram Feed + cruzar para Facebook Page.
- Stories: Instagram Stories apenas.
- Dica de manejo (Post 11): Instagram Feed + Facebook Page.
- Urgência (Post 14): Instagram Feed + Facebook Page + WhatsApp (grupos).

---

## AÇÃO IMEDIATA — POST ATRASADO

**Post 2** (Reel "5 Problemas que Todo Criador Tem") era para ter sido publicado em 2026-04-16 e não foi. Reagendado para:

> **Sexta-feira 2026-04-17, 07:30 (BRT) — Instagram Reel + cross-post Facebook**

Justificativa da hora: hoje (2026-04-16) já passou das 21:30, fora do pico de engajamento noturno — publicar agora entregaria pior performance. Amanhã de manhã, antes do horário comercial, recupera o slot perdido sem emendar com o Post 3 (que fica domingo 19/04 como previsto), mantendo a cadência do plano.

---

## LIMITE TÉCNICO — PUBLICAÇÃO AUTOMÁTICA

**Não há, neste projeto, credenciais da Meta Graph API nem conector MCP para Instagram/Facebook configurados.** Por isso o agendamento e a publicação não podem ser disparados diretamente por código.

Dois caminhos possíveis para automação real:

1. **Meta Business Suite (Meta Planner):** importar o arquivo [`publication_queue.csv`](./publication_queue.csv) pelo Planner → Content → Create bulk post. Agenda todos os Posts de Facebook Page de uma vez. **Atenção:** Instagram Reels e Stories não aceitam agendamento via CSV — precisam ser agendados um a um no app ou via Creator Studio/Meta Business Suite mobile.
2. **Buffer / Later / Metricool:** alternativa com suporte melhor a Reels. O CSV gerado é compatível com Buffer (colunas ajustáveis).

Enquanto a automação via API não for viabilizada, a execução segue o fluxo: ver arquivo por post em [`posts_publicar/`](./posts_publicar/), copiar caption, anexar mídia (`frontend/public/marketing/`), agendar na Meta Business Suite.

---

## CHECKLIST DE EXECUÇÃO DIÁRIA

Para cada post da lista acima:
- [ ] Abrir `marketing/posts_publicar/post_XX.md`
- [ ] Copiar caption/legenda
- [ ] Anexar mídia indicada
- [ ] Agendar no Meta Business Suite para a data/hora prevista
- [ ] Para reels do Instagram: usar o próprio app (agendar via Reels Composer)
- [ ] Marcar linha no arquivo [`STATUS.md`](./posts_publicar/STATUS.md)
