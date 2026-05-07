# STATUS DA FILA DE PUBLICAÇÃO

Marque com `x` quando publicar. Mantenha a data real de publicação.

| Post | Programado para | Formato | Plataforma | Publicado? | Data real | Link do post |
|------|-----------------|---------|------------|------------|-----------|--------------|
| 2    | 2026-04-17 07:30 | Reel     | IG+FB      | [!]        | PENDENTE  | skip automático (Reel exige fluxo manual Meta Business Suite / app) |
| 3    | 2026-04-19 11:00 | Carrossel| IG         | [ ]        |           |              |
| 4    | 2026-04-20 19:00 | Stories  | IG         | [ ]        |           |              |
| 6    | 2026-04-22 19:30 | Reel     | IG+FB      | [!]        | PENDENTE  | tentativa de automação em 2026-04-22 falhou: IG bloqueou file_upload + base64 injection (segurança plugin); FB conta atual não gerencia página Plumar. Exige publicação manual via app/Meta Business Suite OU reconectar IG ao Graph API |
| 7    | 2026-04-24 12:30 | Carrossel| IG+FB      | [!]        | PENDENTE  | 2026-04-24: automação descobriu que IG aceita injeção de File via JS DataTransfer (breakthrough), mas transmissão de base64 >20KB via javascript_tool corrompe string no meio; CORS/CSP do IG bloqueia fetch de plumar.com.br. Requer upload chunked (<10KB por call, ~50 calls p/ 6 slides) OU servir imagens de origem permitida por IG CSP. FB continua bloqueado (conta não gerencia página). |
| 9    | 2026-04-26 11:00 | Carrossel| IG         | [ ]        |           |              |
| 10   | 2026-04-28 19:00 | Reel     | IG         | [ ]        |           |              |
| 11   | 2026-04-30 08:00 | Imagem   | IG+FB      | [x] ✅ ambos publicados | 2026-04-29 | FB: 1146018875251408_122108498108775649 — IG: publicado via automação (@plumar.app) |
| 12   | 2026-05-02 11:00 | Imagem*  | IG+FB      | [x] ✅ ambos publicados | 2026-05-07 | IG: https://www.instagram.com/p/DX1i6aEjqHM/ — FB: 1146018875251408_122111387564775649 — publicado como imagem única (PLUMAR_Post12_Single.png) via file_upload (IG) + Graph API (FB); *formato original era carrossel mas Single.png disponível |
| 13   | 2026-05-04 19:30 | Reel     | IG         | [!]        | PENDENTE  | 2026-05-04: skip automático — formato Reel + vídeo real de beta tester não existe (apenas placeholder PNG). Requer gravação + autorização do beta tester antes de publicar. |
| 14   | 2026-05-06 20:00 | Imagem   | IG+FB      | [x] ✅ ambos publicados | 2026-05-04 | IG: https://www.instagram.com/p/DX6wJiJDsgQ/ — FB: 1146018875251408_122109649292775649 — publicado antecipado (post de urgência; próximo publicável após skip do 13) |
| CORR | 2026-04-28       | Imagem   | IG+FB      | [x] ✅ ambos publicados | 2026-04-28 | FB: 1146018875251408_122108264594775649 — IG: publicado manualmente via app |
