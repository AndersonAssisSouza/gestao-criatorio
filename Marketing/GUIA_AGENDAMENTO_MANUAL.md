# Guia de Agendamento Manual — PLUMAR

**Gerado em:** 2026-04-16
**Motivo:** A automação via navegador esbarrou em duas barreiras:
1. Instagram `@plumar.app` **não está conectado** ao Meta Business Suite (precisa clicar "Conectar Instagram" na home do Business Suite e autorizar o IG). Até isso, todos os posts de IG têm que ser agendados via o app do Instagram mesmo.
2. Facebook (e Instagram) abrem **file picker nativo do sistema operacional** quando pedem mídia — navegação automática não consegue selecionar arquivos nesse diálogo.

Portanto, o caminho mais rápido agora é agendar manualmente. Este guia dá a sequência otimizada.

---

## Pré-execução (~3 min)

1. Abra https://business.facebook.com/latest/planner/ (Meta Business Suite → Planner).
2. Na home (antes do Planner), clique em **"Conectar Instagram"** e autorize `@plumar.app`. Sem isso, cross-post IG não funciona.
3. Abra em janelas auxiliares:
   - `Marketing/posts_publicar/STATUS.md` (tracking)
   - Pasta `frontend/public/marketing/` no Explorer para arrastar mídia.

## Sequência de agendamento (~20 min total)

Para cada post abaixo, o fluxo é o mesmo:

1. No Planner, clique em **Criar post** (ou Criar reel / Criar story conforme o tipo).
2. Escolha destinos: Facebook Page + Instagram (quando houver).
3. Cole a caption do arquivo `Marketing/posts_publicar/post_XX.md` (bloco "Caption").
4. Arraste a mídia da pasta `frontend/public/marketing/` para a área do composer.
5. Clique em **Programar** → defina data/hora conforme tabela abaixo.
6. Confirme e marque `[x]` no `STATUS.md` com a data real.

### Ordem recomendada (do mais urgente ao mais distante)

| Ordem | Post | Tipo | Data/hora | Arquivo de mídia |
|-------|------|------|-----------|------------------|
| 1 | **Post 2 (URGENTE)** | Reel | 2026-04-17 07:30 | `PLUMAR_Post2_Reel_5Problemas.mp4` |
| 2 | Post 3 | Carrossel 7 slides | 2026-04-19 11:00 | `PLUMAR_Post3_Slide1..7.png` |
| 3 | Post 4 | Story (3 telas) | 2026-04-20 19:00 | `PLUMAR_Post4_Story1..3.png` (só IG) |
| 4 | Post 6 | Reel | 2026-04-22 19:30 | `PLUMAR_Post6_Reel_Simulador.mp4` |
| 5 | Post 7 | Carrossel 6 slides | 2026-04-24 12:30 | `PLUMAR_Post7_Slide1..6.png` |
| 6 | Post 9 | Carrossel 8 slides | 2026-04-26 11:00 | `PLUMAR_Post9_Slide1..8.png` |
| 7 | Post 10 | Reel | 2026-04-28 19:00 | `PLUMAR_Post10_Reel_3Funcionalidades.mp4` |
| 8 | Post 11 | Imagem | 2026-04-30 08:00 | `PLUMAR_Post11_DicaManejo.png` |
| 9 | Post 12 | Carrossel 7 slides | 2026-05-02 11:00 | `PLUMAR_Post12_Slide1..7.png` |
| 10 | Post 13 | Reel (depende de vídeo real) | 2026-05-04 19:30 | pendente |
| 11 | Post 14 | Imagem | 2026-05-06 20:00 | `PLUMAR_Post14_Urgencia.png` |

### Dicas de produtividade

- **Stories (Post 4):** só disponível no app do Instagram. Agende via **Creator Studio → Stories** no celular ou use figurinhas de enquete na hora.
- **Carrosséis:** arraste os arquivos de slide **na ordem correta** (slide 1 primeiro). O Business Suite respeita a ordem de drop.
- **Reels:** no Meta Business Suite, reels do Facebook herdam a vinculação com o IG se conectado. Ative "Compartilhar no Instagram" no composer.
- **Hashtags:** sempre primeiro comentário, não na caption principal — melhora alcance.

---

## O que bloqueia a automação completa hoje

- Ausência de Page Access Token de longa duração para Meta Graph API
- Ausência de Instagram vinculado ao Business Suite (sem isso, não tem IG Graph API também)
- Meta bloqueia automação via navegador para upload de mídia por design (anti-bot)

## Roadmap para automação 100% — ver `docs/spec-meta-graph-api.md`
