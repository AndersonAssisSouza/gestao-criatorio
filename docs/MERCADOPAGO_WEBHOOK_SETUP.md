# Configurar MERCADOPAGO_WEBHOOK_SECRET

**Status atual:** webhook do MP roda em modo `observe` (warn-only) porque
`MERCADOPAGO_WEBHOOK_SECRET` nao esta definido. Com ele, o modo padrao
passa a `enforce` (fail-closed), bloqueando webhooks com assinatura
HMAC invalida.

> Protecao ja ativa **sem** o webhook secret:
> - Lookup do pagamento via API oficial do MP (`getPaymentById`)
> - Match entre `external_reference` e payment local no Neon
> - Rejeicao se valor pago divergir em mais de R$ 0,02

## Passo-a-passo

### 1. Gerar o secret no painel Mercado Pago

1. Abrir <https://www.mercadopago.com.br/developers/panel/app>
2. Selecionar a aplicacao **Plumar** (owner: anderson.assis@lumaplataforma.com.br)
3. Menu lateral -> **Webhooks** -> **Configurar notificacoes**
4. URL de producao:
   ```
   https://api.plumar.com.br/api/payments/mercadopago/webhook
   ```
5. Eventos a marcar: `payment` (obrigatorio). Os demais sao opcionais.
6. Clicar em **Salvar**. O painel vai exibir a **Chave secreta** (valor que
   comeca com letras/numeros aleatorios, ex.: `5c3a7f8d9e...`).
7. Copiar a chave — ela nao e exibida novamente.

### 2. Aplicar no GitHub Secrets

```bash
cd "C:/Users/ander/OneDrive - Luisa Moraes Advogados/Controle Geral/Codigos/gestao-criatorio"
gh secret set WORKER_MERCADOPAGO_WEBHOOK_SECRET
# Colar a chave quando pedir
```

Ou via UI: <https://github.com/AndersonAssisSouza/gestao-criatorio/settings/secrets/actions>
e criar/atualizar `WORKER_MERCADOPAGO_WEBHOOK_SECRET`.

### 3. Rodar o workflow para aplicar no Worker

```bash
gh workflow run set-worker-secrets.yml --ref master
gh run watch   # aguardar ~30s
```

Ou via UI: <https://github.com/AndersonAssisSouza/gestao-criatorio/actions/workflows/set-worker-secrets.yml>
-> **Run workflow**.

### 4. Atualizar o `.env` local (opcional, para testes em dev)

Editar `backend/.env` e `backend/.env.secrets`:

```
MERCADOPAGO_WEBHOOK_SECRET=<valor_copiado_do_painel>
```

### 5. Validar em producao

Fazer um pagamento de teste (sandbox ou producao com estorno):

```bash
# Assinar como owner, gerar checkout, pagar com cartao de teste
# https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards
```

Logs do Worker:
```bash
cd backend
npx wrangler tail --format pretty
```

Procurar por:
- `[payments/webhook] Assinatura HMAC valida` -> enforce ativo, OK
- `[payments/webhook] Assinatura HMAC invalida ...` -> verificar secret

### 6. Opcional: forcar modo enforce mesmo sem secret

Se quiser garantir que webhook sem secret seja rejeitado (em vez de cair
em `observe`):

```bash
echo "enforce" | npx wrangler secret put WEBHOOK_SIGNATURE_MODE
```

Valores aceitos: `enforce`, `observe`, `disabled`.

## Troubleshooting

### Webhook retorna 401 "Assinatura invalida"

- Confirmar que o secret no MP e o mesmo aplicado no Worker
- Conferir clock skew: MP assina com `ts=unix`, se o relogio do Worker
  divergir por >5 min, o hook rejeita por `ts_fora_da_janela`
- Desabilitar temporariamente: `WEBHOOK_SIGNATURE_MODE=observe`

### MP nao entrega webhook

- Ver lista de tentativas em <https://www.mercadopago.com.br/developers/panel/app/{APP_ID}/webhooks>
- Confirmar URL publica acessivel e SSL valido (`curl -v https://api.plumar.com.br/health`)
- Rate limit: backend tem rate limit em `/api/`, pode estar bloqueando

### Codigo de referencia

- Validacao HMAC: `backend/src/controllers/payment.controller.js` `verifyMercadoPagoSignature`
- Config: `backend/src/config/payment-gateway.config.js`
- Workflow de secrets: `.github/workflows/set-worker-secrets.yml`

## Fluxo de assinatura HMAC

O MP envia header `x-signature: ts=<unix>,v1=<hmac>` e `x-request-id`.
O manifest a ser assinado e:

```
id:<data.id>;request-id:<x-request-id>;ts:<ts>;
```

Com `HMAC-SHA256(manifest, WEBHOOK_SECRET)` em hex lowercase.
O backend compara com `timingSafeEqual` para evitar timing attack.

Docs MP: <https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/security/x-signature>
