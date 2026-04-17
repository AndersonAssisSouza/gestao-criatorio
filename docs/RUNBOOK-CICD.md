# RUNBOOK - CI/CD PLUMAR (Cloudflare)

**Última atualização:** 2026-04-16
**Owner:** Anderson Assis
**Escopo:** Pipeline de deploy automatizado do PLUMAR (frontend Pages + backend Worker)

---

## 1. Arquitetura resumida

| Componente | Onde roda | Domínio | Workflow |
|---|---|---|---|
| Frontend | Cloudflare Pages | plumar.com.br | `.github/workflows/deploy.yml` — job `frontend` |
| Backend | Cloudflare Workers | api.plumar.com.br | `.github/workflows/deploy.yml` — job `backend` |
| Secrets Worker | Cloudflare Dashboard | — | `.github/workflows/set-worker-secrets.yml` (manual) |

**Gatilho:** `git push origin master` → Actions dispara os dois jobs em paralelo. Tempo total: ~33s.

---

## 2. Observabilidade de falhas

### 2.1 Notificação padrão do GitHub Actions
Por padrão, o GitHub envia e-mail automático para o autor do commit quando um workflow falha. Confirmar em:
`GitHub → Settings → Notifications → Actions → "Send notifications for failed workflows only"` (marcar).

### 2.2 Notificação no Microsoft Teams (opcional, recomendado)
Se quiser alerta imediato no Teams:
1. No canal de trabalho, clicar em `...` → Connectors → Incoming Webhook → copiar URL.
2. Adicionar secret `TEAMS_WEBHOOK_URL` no repositório.
3. Adicionar ao final do `deploy.yml`:

```yaml
  notify-failure:
    needs: [frontend, backend]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Notify Teams on failure
        run: |
          curl -H "Content-Type: application/json" -d '{
            "text": "Deploy PLUMAR falhou no commit ${{ github.sha }} - ver ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          }' "${{ secrets.TEAMS_WEBHOOK_URL }}"
```

### 2.3 Verificação manual
- Runs: https://github.com/AndersonAssisSouza/gestao-criatorio/actions
- Cloudflare Pages (deploys): Dashboard → Pages → plumar → Deployments
- Cloudflare Workers (versions): Dashboard → Workers & Pages → api-plumar → Deployments

---

## 3. Rollback

### 3.1 Frontend (Pages) — rollback em 1 clique
1. Cloudflare Dashboard → Pages → projeto `plumar`.
2. Aba **Deployments** → localizar o deployment anterior funcional.
3. Clicar em `...` → **Rollback to this deployment** → confirmar.
4. Propagação: ~30s.

### 3.2 Backend (Worker) — via Wrangler
```bash
cd backend
npx wrangler deployments list        # lista os deployments; copiar o ID anterior
npx wrangler rollback <deployment-id> # volta para a versão indicada
```
Alternativa pelo Dashboard: Workers & Pages → `api-plumar` → **Deployments** → selecionar versão → **Rollback**.

### 3.3 Critério de rollback
Disparar rollback IMEDIATO se:
- Erro 5xx em > 5% das requisições por mais de 2 minutos;
- Falha de autenticação/login generalizada;
- Queda do simulador genético ou da tela principal.

Depois do rollback: abrir issue no GitHub com o `sha` do commit problemático, logs do Cloudflare e plano de correção.

---

## 4. Lock file e `npm install` vs `npm ci`

### 4.1 Situação atual (2026-04-16)
O workflow usa `npm install` porque o `package-lock.json` estava dessincronizado com o `package.json`, quebrando o `npm ci`.

### 4.2 Por que voltar para `npm ci`
- Mais rápido (não resolve árvore de dependências).
- Determinístico (instala exatamente o lock file).
- Falha se houver divergência — o que é exatamente o comportamento desejado em CI.

### 4.3 Procedimento para regularizar
```bash
# No ambiente local (Windows)
cd frontend
rm -rf node_modules package-lock.json
npm install
# validar build local
npm run build

cd ../backend
rm -rf node_modules package-lock.json
npm install
# validar build local
npm run build

# voltar à raiz, commitar os dois locks
git add frontend/package-lock.json backend/package-lock.json
git commit -m "chore: regenerate package-lock.json (frontend + backend)"
git push origin master
```

### 4.4 Depois que o push passar
Editar `.github/workflows/deploy.yml`:
- Trocar `npm install` → `npm ci` em ambos os jobs.
- Fazer novo push e confirmar que o run passa.

---

## 5. Secrets do Worker (referência)

| Secret | Observação |
|---|---|
| DATABASE_URL | Postgres Supabase. Resetar senha no Supabase Dashboard se comprometida. |
| +11 outros | Configurados via Cloudflare Dashboard → Worker → Settings → Variables & Secrets |

Para atualizar um secret rapidamente:
```bash
cd backend
npx wrangler secret put NOME_DO_SECRET
# colar o valor quando pedido
```

---

## 6. Quem aciona o quê

| Situação | Ação imediata | Responsável |
|---|---|---|
| Run falhou no Actions | Ler log → ajustar → push | Anderson |
| Produção caiu (5xx) | Rollback Pages + Worker | Anderson |
| Secret vazado | Regenerar no serviço de origem + `wrangler secret put` | Anderson |
| Domínio fora do ar | Cloudflare Dashboard → DNS → validar registros | Anderson |

---

## 7. Checklist de sanidade trimestral

- [ ] Testar rollback manualmente (Pages + Worker) em ambiente real.
- [ ] Rotacionar `DATABASE_URL` e demais secrets críticos.
- [ ] Validar que o `npm ci` continua passando (sinal de lock saudável).
- [ ] Revisar runs do último trimestre: quantos falharam? Padrão?
- [ ] Atualizar este runbook com aprendizados.
