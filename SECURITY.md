# Política de Segurança — PLUMAR

## 📢 Reporte de Vulnerabilidades

Se você encontrou uma vulnerabilidade de segurança no PLUMAR
(https://plumar.com.br / https://api.plumar.com.br), pedimos que
reporte de forma responsável **antes de divulgar publicamente**.

### Como reportar

- **E-mail:** `plumarapp@plumar.com.br`
- **Assunto:** `[SECURITY] <descrição curta>`

Inclua no reporte:

1. Descrição da vulnerabilidade
2. Passos para reproduzir (PoC)
3. Impacto estimado (quais dados ou operações afetadas)
4. Recomendação de correção (opcional)
5. Seu contato para acompanhamento

### Prazos de resposta

| Etapa | Prazo |
|---|---|
| Acknowledgement inicial | até 48h |
| Triagem e classificação | até 5 dias úteis |
| Plano de correção | até 10 dias úteis |
| Deploy do patch (crítico) | até 72h após confirmação |
| Deploy do patch (alto) | até 14 dias |
| Deploy do patch (médio/baixo) | próximo ciclo de release |

### Escopo

Em escopo:
- Domínios: `plumar.com.br`, `api.plumar.com.br`
- Código: este repositório (`frontend/`, `backend/`, workflows)
- APIs públicas listadas em `/api/*`

Fora de escopo (não reporte):
- Engenharia social / phishing contra colaboradores
- Ataques físicos
- DoS volumétrico (ataque de saturação)
- Vulnerabilidades em dependências de terceiros sem PoC específica no PLUMAR
- Clickjacking em páginas públicas sem ação sensível

### Safe Harbor

Pesquisadores que seguirem esta política **não serão processados**
civil ou criminalmente, desde que:

- Não acessem dados de terceiros além do necessário para demonstrar a falha
- Não modifiquem nem apaguem dados
- Não degradem o serviço intencionalmente
- Dêem 90 dias para correção antes de divulgação pública (ou o prazo
  acordado após o reporte)

### Reconhecimento

Pesquisadores que reportarem vulnerabilidades válidas serão creditados
publicamente (se quiserem) no Hall of Fame e no changelog do patch.

## 🔒 Versões suportadas

Apenas a versão atual em produção (`master`) recebe patches de segurança.

## 🛡️ Práticas de segurança em vigor

- JWT HS256 com jose + secret mínimo 32 chars
- bcrypt cost 12 para senhas
- HTTPS obrigatório + HSTS preload
- CSP restritiva (`default-src 'self'`, `frame-ancestors 'none'`)
- CORS allowlist explícita
- Rate limiting em login/register/api
- Isolamento multi-tenant por criatório
- Validação HMAC de webhook MercadoPago
- Dependabot + CodeQL semanais
- `npm audit` no CI
- Logs estruturados sem PII
- Política de senha forte (10+ chars, classes, blocklist)

## 📬 Contato

Perguntas não relacionadas a vulnerabilidades: `plumarapp@plumar.com.br`
