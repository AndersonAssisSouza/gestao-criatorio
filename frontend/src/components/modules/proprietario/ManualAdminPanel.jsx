import { useState } from 'react'
import { BRAND } from '../../../brand'

const SECTIONS = [
  { id: 'visao',       label: 'Visao Geral' },
  { id: 'acesso',      label: 'Acesso e Privilegios' },
  { id: 'assinantes',  label: 'Gestao de Assinantes' },
  { id: 'mutacoes',    label: 'Simulador Genetico' },
  { id: 'pagamentos',  label: 'Pagamentos' },
  { id: 'controle',    label: 'Controle de Acesso' },
  { id: 'modulos',     label: 'Modulos Operacionais' },
  { id: 'tecnico',     label: 'Config. Tecnica' },
  { id: 'fluxo',       label: 'Fluxo do Assinante' },
  { id: 'problemas',   label: 'Resolucao de Problemas' },
]

const S = {
  wrapper: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  nav: {
    position: 'sticky', top: 12, flex: '0 0 190px',
    display: 'flex', flexDirection: 'column', gap: 2,
    background: 'var(--bg-panel-solid)', borderRadius: 12,
    border: '1px solid var(--line-soft)', padding: '14px 10px',
    maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
  },
  navBtn: (active) => ({
    background: active ? 'var(--accent-ghost)' : 'transparent',
    border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12,
    fontWeight: active ? 700 : 400, color: active ? 'var(--accent)' : 'var(--text-soft)',
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
  }),
  content: { flex: 1, minWidth: 0 },
  section: {
    background: 'var(--bg-panel-solid)', borderRadius: 14,
    border: '1px solid var(--line-soft)', padding: '28px 32px', marginBottom: 20,
  },
  h2: {
    fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400,
    color: 'var(--text-main)', marginBottom: 16, paddingBottom: 10,
    borderBottom: '1px solid var(--line-soft)',
  },
  h3: { fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginTop: 20, marginBottom: 8 },
  p: { fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7, marginBottom: 10 },
  ol: { fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.8, paddingLeft: 22, marginBottom: 10 },
  ul: { fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.8, paddingLeft: 22, marginBottom: 10, listStyleType: 'disc' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 },
  th: {
    background: 'var(--bg-deep)', padding: '8px 12px', fontWeight: 700,
    textAlign: 'left', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '2px solid var(--line-soft)',
  },
  td: { padding: '8px 12px', borderBottom: '1px solid var(--line-soft)', color: 'var(--text-soft)', verticalAlign: 'top' },
  strong: { fontWeight: 600, color: 'var(--text-main)' },
  badge: {
    display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 10px',
    borderRadius: 20, background: 'var(--accent-ghost)', color: 'var(--accent)',
  },
  code: {
    fontFamily: 'monospace', fontSize: 12, background: 'var(--bg-deep)',
    padding: '2px 8px', borderRadius: 4, color: 'var(--text-soft)',
  },
  codeBlock: {
    fontFamily: 'monospace', fontSize: 12, background: 'var(--bg-deep)',
    padding: '14px 18px', borderRadius: 8, color: 'var(--text-soft)',
    lineHeight: 1.8, marginBottom: 14, overflowX: 'auto', whiteSpace: 'pre-wrap',
  },
  faqQ: { fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 14, marginBottom: 4 },
  faqA: {
    fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7, marginBottom: 8,
    paddingLeft: 8, borderLeft: '3px solid var(--accent-ghost)',
  },
}

function T({ cols, rows }) {
  return (
    <table style={S.table}>
      <thead><tr>{cols.map((c, i) => <th key={i} style={S.th}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={S.td}>{cell}</td>)}</tr>)}</tbody>
    </table>
  )
}

export function ManualAdminPanel() {
  const [active, setActive] = useState('visao')

  const scrollTo = (id) => {
    setActive(id)
    const el = document.getElementById(`admin-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={S.wrapper}>
      <nav style={S.nav} className="ajuda-nav">
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', padding: '0 12px 8px', borderBottom: '1px solid var(--line-soft)', marginBottom: 6 }}>
          Manual Admin
        </div>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" style={S.navBtn(active === s.id)} onClick={() => scrollTo(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      <div style={S.content}>
        {/* 1 - Visao Geral */}
        <div id="admin-visao" style={S.section}>
          <h2 style={S.h2}>1. Visao Geral do Perfil Proprietario</h2>
          <p style={S.p}>O perfil <strong style={S.strong}>Proprietario (owner)</strong> e o nivel mais alto de acesso no {BRAND.shortName}:</p>
          <ul style={S.ul}>
            <li>Acesso vitalicio e permanente (nunca expira)</li>
            <li>Acesso a <strong style={S.strong}>todos os modulos</strong>, incluindo os exclusivos</li>
            <li>Gerenciar assinantes, pagamentos e acessos</li>
            <li>Simulador genetico de mutacoes (modulo exclusivo)</li>
          </ul>

          <h3 style={S.h3}>Diferencas entre perfis</h3>
          <T cols={['Recurso', 'Usuario', 'Admin', 'Proprietario']} rows={[
            ['Modulos operacionais', 'Com assinatura', 'Sim', 'Sim'],
            ['Assinatura e Configuracoes', 'Sim', 'Sim', 'Sim'],
            ['Modulo Mutacoes', 'Nao', 'Nao', 'Sim'],
            ['Painel do Proprietario', 'Nao', 'Nao', 'Sim'],
            ['Gerenciar assinantes', 'Nao', 'Nao', 'Sim'],
            ['Aprovar/rejeitar pagamentos', 'Nao', 'Nao', 'Sim'],
            ['Conceder/revogar acesso', 'Nao', 'Nao', 'Sim'],
            ['Acesso vitalicio', 'Nao', 'Nao', 'Sim'],
          ]} />
        </div>

        {/* 2 - Acesso e Privilegios */}
        <div id="admin-acesso" style={S.section}>
          <h2 style={S.h2}>2. Acesso e Privilegios</h2>

          <h3 style={S.h3}>Menu lateral do Proprietario</h3>
          <T cols={['Grupo', 'Modulos']} rows={[
            ['Manejo', 'Plantel, Aves em Choco, Gaiolas, Filhotes'],
            ['Cadastros', 'Especies, Criatorios, Aneis'],
            ['Analise', 'Financeiro, Ex-Plantel, Mutacoes (exclusivo)'],
            ['Sistema', 'Assinatura, Proprietario (exclusivo), Ajuda, Configuracoes'],
          ]} />

          <h3 style={S.h3}>Identificacao do perfil</h3>
          <p style={S.p}>No rodape da barra lateral, seu perfil mostra suas iniciais, seu nome e o label <span style={S.badge}>Vitalicio</span> indicando acesso permanente.</p>
        </div>

        {/* 3 - Gestao de Assinantes */}
        <div id="admin-assinantes" style={S.section}>
          <h2 style={S.h2}>3. Painel do Proprietario — Gestao de Assinantes</h2>

          <h3 style={S.h3}>Cards de estatisticas</h3>
          <T cols={['Card', 'Descricao']} rows={[
            ['Clientes', 'Total de usuarios cadastrados (excluindo o proprietario)'],
            ['Ativos', 'Usuarios com acesso liberado (assinatura ativa)'],
            ['Cobrancas', 'Pagamentos pendentes de validacao'],
            ['Trial', 'Usuarios no periodo de teste gratuito (7 dias)'],
          ]} />

          <h3 style={S.h3}>Lista de assinantes</h3>
          <T cols={['Coluna', 'Descricao']} rows={[
            ['Nome', 'Nome do usuario'],
            ['Email', 'E-mail de cadastro'],
            ['Plano', 'Anual, Mensal, Vitalicio ou Trial'],
            ['Expira em', 'Data de expiracao ou "Sem vencimento"'],
            ['Status', 'Indicador visual (verde = ativo, vermelho = bloqueado)'],
          ]} />

          <h3 style={S.h3}>Selecionando um assinante</h3>
          <p style={S.p}>Clique na linha de um assinante para ver detalhes completos, historico de pagamentos e executar acoes administrativas.</p>
        </div>

        {/* 4 - Simulador Genetico */}
        <div id="admin-mutacoes" style={S.section}>
          <h2 style={S.h2}>4. Modulo Mutacoes — Simulador Genetico do Tarin</h2>
          <p style={S.p}>Simulador exclusivo de cruzamentos geneticos para a especie <strong style={S.strong}>Tarin (Spinus cucullatus)</strong>. Os 51 cenarios de mutacao automaticos sao exclusivos para o Tarin — outras especies nao possuem base genetica automatica no momento.</p>

          <h3 style={S.h3}>Como funciona</h3>
          <ol style={S.ol}>
            <li>Selecione a especie <strong style={S.strong}>Tarin</strong></li>
            <li>Selecione a <strong style={S.strong}>mutacao do macho</strong> (pai)</li>
            <li>Selecione a <strong style={S.strong}>mutacao da femea</strong> (mae)</li>
            <li>O sistema calcula automaticamente as probabilidades geneticas</li>
          </ol>

          <h3 style={S.h3}>Mutacoes disponiveis</h3>
          <T cols={['Mutacao', 'Cor', 'Tipo Genetico']} rows={[
            ['Ancestral', 'Vermelho', 'Selvagem (sem mutacao)'],
            ['Canela', 'Marrom', 'Ligada ao sexo'],
            ['Pastel', 'Rosa', 'Ligada ao sexo'],
            ['Canela Pastel', 'Lilas', 'Ligada ao sexo (dupla)'],
            ['Topazio', 'Dourado', 'Autossomico recessivo'],
            ['Diluido', 'Rosa claro', 'Autossomico dominante'],
            ['Duplo Diluido', 'Rosa muito claro', 'Autossomico dominante (homozigoto)'],
            ['Portador de Canela', 'Bege', 'Macho portador'],
            ['Portador de Pastel', 'Rosa claro', 'Macho portador'],
            ['Portador de Topazio', 'Dourado claro', 'Portador'],
            ['Passepartout Tipo I e II', 'Lavanda', 'Crossing-over'],
          ]} />

          <h3 style={S.h3}>Base de cruzamentos (exclusiva do Tarin)</h3>
          <p style={S.p}>O sistema possui <strong style={S.strong}>51 cenarios de cruzamento</strong> pre-calculados <strong style={S.strong}>exclusivamente para o Tarin</strong>, incluindo mutacoes puras, portadores, crossing-over (Passepartout) e calculos de probabilidade separados para machos e femeas. Outras especies nao possuem simulacao genetica automatica.</p>

          <h3 style={S.h3}>Opcao de Crossing-over</h3>
          <p style={S.p}>Para cruzamentos aplicaveis, ative a opcao de crossing-over para ver resultados alternativos com recombinacao genetica.</p>
        </div>

        {/* 5 - Pagamentos */}
        <div id="admin-pagamentos" style={S.section}>
          <h2 style={S.h2}>5. Gerenciamento de Pagamentos</h2>

          <h3 style={S.h3}>Fluxo de pagamento</h3>
          <div style={S.codeBlock}>
            {'Usuario escolhe plano → Checkout MercadoPago → Pagamento → Webhook notifica backend → Acesso liberado'}
          </div>
          <p style={S.p}>Se o pagamento for por PIX ou manual, pode ser necessaria <strong style={S.strong}>aprovacao manual</strong> pelo proprietario.</p>

          <h3 style={S.h3}>Status de pagamento</h3>
          <T cols={['Status', 'Significado', 'Acao']} rows={[
            ['redirect_pending', 'Redirecionado ao MercadoPago', 'Aguardar'],
            ['awaiting_payment', 'Checkout criado, aguardando', 'Aguardar ou contatar'],
            ['processing', 'Em analise pelo gateway', 'Aguardar'],
            ['paid', 'Pagamento confirmado', 'Nenhuma — acesso liberado'],
            ['rejected', 'Pagamento recusado', 'Informar o usuario'],
          ]} />

          <h3 style={S.h3}>Aprovando manualmente</h3>
          <ol style={S.ol}>
            <li>No Painel do Proprietario, selecione o assinante</li>
            <li>Localize o pagamento pendente</li>
            <li>Clique em <strong style={S.strong}>"Confirmar pagamento"</strong></li>
            <li>O acesso e liberado automaticamente</li>
          </ol>

          <h3 style={S.h3}>Rejeitando um pagamento</h3>
          <ol style={S.ol}>
            <li>Selecione o assinante e localize o pagamento</li>
            <li>Clique em <strong style={S.strong}>"Recusar"</strong></li>
            <li>O acesso permanece bloqueado</li>
          </ol>
        </div>

        {/* 6 - Controle de Acesso */}
        <div id="admin-controle" style={S.section}>
          <h2 style={S.h2}>6. Controle de Acesso dos Usuarios</h2>

          <h3 style={S.h3}>Acoes disponiveis</h3>
          <T cols={['Acao', 'Descricao']} rows={[
            ['Conceder Acesso', 'Libera acesso com plano especifico (Mensal, Anual ou Vitalicio)'],
            ['Aprovar Pagamento', 'Confirma pagamento pendente e libera acesso'],
            ['Rejeitar Pagamento', 'Recusa pagamento e mantem acesso bloqueado'],
            ['Estender Trial', 'Adiciona mais dias ao periodo de teste'],
            ['Revogar Acesso', 'Cancela assinatura ativa e bloqueia acesso'],
          ]} />

          <h3 style={S.h3}>Concedendo acesso manual</h3>
          <ol style={S.ol}>
            <li>Selecione o assinante na lista</li>
            <li>Clique em <strong style={S.strong}>"Liberar mensal"</strong> ou <strong style={S.strong}>"Liberar anual"</strong></li>
            <li>O acesso e liberado imediatamente</li>
          </ol>
          <p style={S.p}>Util para: cortesia para parceiros, compensacao por problemas ou testes internos.</p>

          <h3 style={S.h3}>Estendendo o periodo de teste</h3>
          <ol style={S.ol}>
            <li>Selecione o assinante em trial</li>
            <li>Defina a quantidade de dias</li>
            <li>Clique em <strong style={S.strong}>"Estender trial"</strong> ou <strong style={S.strong}>"Reativar trial"</strong></li>
          </ol>

          <h3 style={S.h3}>Revogando acesso</h3>
          <ol style={S.ol}>
            <li>Selecione o assinante ativo</li>
            <li>Clique em <strong style={S.strong}>"Revogar acesso"</strong></li>
            <li>Confirme — o usuario perde acesso imediatamente</li>
          </ol>
        </div>

        {/* 7 - Modulos Operacionais */}
        <div id="admin-modulos" style={S.section}>
          <h2 style={S.h2}>7. Todos os Modulos Operacionais</h2>
          <p style={S.p}>Como proprietario, voce tem acesso a todos os modulos. Consulte a <strong style={S.strong}>Central de Ajuda</strong> (menu Ajuda) para detalhes de cada modulo.</p>

          <T cols={['Modulo', 'Finalidade']} rows={[
            ['Plantel', 'Gestao de aves ativas — cadastro, edicao, busca'],
            ['Aves em Choco', 'Ciclos reprodutivos — casais, posturas, previsoes'],
            ['Gaiolas', 'Gaiolas — capacidade, ocupacao, manutencao'],
            ['Filhotes', 'Nascimentos — desenvolvimento, anelamento, promocao'],
            ['Especies', 'Catalogo taxonomico — dados cientificos e conservacao'],
            ['Criatorios', 'Espacos fisicos — temperatura, umidade, capacidade'],
            ['Aneis', 'Anilhas — IBAMA, FOB, criadouro, disponibilidade'],
            ['Financeiro', 'Receitas e despesas — vendas, compras, controle fiscal'],
            ['Ex-Plantel', 'Aves que sairam — motivo, destinatario, valor'],
            ['Mutacoes', 'Simulador genetico exclusivo do Tarin — 51 cenarios'],
          ]} />
        </div>

        {/* 8 - Config Tecnica */}
        <div id="admin-tecnico" style={S.section}>
          <h2 style={S.h2}>8. Configuracao Tecnica</h2>

          <h3 style={S.h3}>Infraestrutura</h3>
          <T cols={['Componente', 'Servico']} rows={[
            ['Frontend', 'GitHub Pages'],
            ['Backend', 'Vercel Serverless'],
            ['Banco de Dados', 'Neon PostgreSQL'],
            ['Pagamentos', 'MercadoPago'],
          ]} />

          <h3 style={S.h3}>Variaveis de ambiente do Backend</h3>
          <T cols={['Variavel', 'Descricao']} rows={[
            ['DATABASE_URL', 'String de conexao do Neon PostgreSQL'],
            ['DATABASE_SSL', 'Habilita SSL na conexao (true)'],
            ['JWT_SECRET', 'Chave secreta para assinatura de tokens JWT'],
            ['JWT_EXPIRES_IN', 'Duracao do token (24h)'],
            ['OWNER_EMAILS', 'E-mails do proprietario (separados por virgula)'],
            ['OWNER_NAME', 'Nome do proprietario'],
            ['OWNER_PASSWORD', 'Senha do proprietario'],
            ['FRONTEND_URL', 'URL do frontend para CORS'],
            ['MERCADOPAGO_ACCESS_TOKEN', 'Token de producao do MercadoPago'],
            ['NODE_ENV', 'Ambiente (production)'],
          ]} />

          <h3 style={S.h3}>Endpoints da API</h3>
          <p style={S.p}><strong style={S.strong}>Autenticacao:</strong></p>
          <T cols={['Metodo', 'Endpoint', 'Descricao']} rows={[
            ['POST', '/api/auth/register', 'Criar conta'],
            ['POST', '/api/auth/login', 'Login'],
            ['POST', '/api/auth/logout', 'Logout'],
            ['GET', '/api/auth/me', 'Dados do usuario logado'],
            ['POST', '/api/auth/forgot-password', 'Recuperacao de senha'],
            ['POST', '/api/auth/reset-password', 'Redefinir senha'],
          ]} />

          <p style={S.p}><strong style={S.strong}>Acesso e Assinatura (owner):</strong></p>
          <T cols={['Metodo', 'Endpoint', 'Descricao']} rows={[
            ['GET', '/api/access/my-access', 'Status do acesso'],
            ['POST', '/api/access/create-checkout', 'Criar checkout MercadoPago'],
            ['GET', '/api/access/list-subscribers', 'Listar assinantes'],
            ['POST', '/api/access/grant-access', 'Conceder acesso'],
            ['POST', '/api/access/approve-payment', 'Aprovar pagamento'],
            ['POST', '/api/access/reject-payment', 'Rejeitar pagamento'],
            ['POST', '/api/access/revoke-access', 'Revogar acesso'],
          ]} />

          <h3 style={S.h3}>Webhook do MercadoPago</h3>
          <div style={S.codeBlock}>
            /api/payments/mercadopago/webhook
          </div>
          <p style={S.p}>Este endpoint deve ser cadastrado no painel de desenvolvedor do MercadoPago para confirmacao automatica de pagamentos.</p>
        </div>

        {/* 9 - Fluxo do Assinante */}
        <div id="admin-fluxo" style={S.section}>
          <h2 style={S.h2}>9. Fluxo Completo de um Novo Assinante</h2>

          <div style={S.codeBlock}>
{`1. Usuario acessa o sistema e clica em "Criar conta"
         |
2. Preenche nome, e-mail e senha
         |
3. Sistema cria conta com role="user" e trial de 7 dias
         |
4. Usuario tem acesso a todos os modulos por 7 dias
         |
5. No Painel do Proprietario, o card "Trial" incrementa
         |
   +-----------+-----------+
   |                       |
6a. Trial expira     6b. Usuario contrata plano
   |                       |
   |                  7. Redireciona ao MercadoPago
   |                       |
   |                  8. Pagamento confirmado
   |                       |
   v                       v
Perde acesso          Acesso ativo
(so Assinatura)       (todos os modulos)`}
          </div>

          <h3 style={S.h3}>Cenarios de intervencao manual</h3>
          <ul style={S.ul}>
            <li><strong style={S.strong}>Pagamento PIX nao confirmado:</strong> Aprovar manualmente no Painel</li>
            <li><strong style={S.strong}>Mais tempo de teste:</strong> Estender trial</li>
            <li><strong style={S.strong}>Parceiro ou cortesia:</strong> Conceder acesso Vitalicio</li>
            <li><strong style={S.strong}>Problema com assinante:</strong> Revogar acesso</li>
          </ul>
        </div>

        {/* 10 - Resolucao de Problemas */}
        <div id="admin-problemas" style={S.section}>
          <h2 style={S.h2}>10. Resolucao de Problemas</h2>

          <div style={S.faqQ}>Usuario nao consegue fazer login</div>
          <div style={S.faqA}>Orientar a usar "Esqueci minha senha" para redefinir a senha.</div>

          <div style={S.faqQ}>Usuario nao ve os modulos operacionais</div>
          <div style={S.faqA}>Assinatura expirada ou trial encerrado. No Painel do Proprietario, selecione o usuario, verifique o status e conceda acesso ou estenda o trial.</div>

          <div style={S.faqQ}>Pagamento aparece como pendente</div>
          <div style={S.faqA}>Verifique no MercadoPago se o pagamento foi recebido. Se confirmado, aprove manualmente no Painel. Se nao, peca ao usuario para tentar novamente.</div>

          <div style={S.faqQ}>Dados do sistema aparecem vazios</div>
          <div style={S.faqA}>Primeiro acesso ou banco sem dados iniciais. Comece cadastrando especies e gaiolas, depois popule o plantel.</div>

          <div style={S.faqQ}>Erro 401 (nao autorizado)</div>
          <div style={S.faqA}>Token JWT expirado (expira em 24h). Faca logout e login novamente.</div>

          <div style={S.faqQ}>Cores do sistema estao diferentes</div>
          <div style={S.faqA}>Configuracoes de tema salvas no navegador. Acesse Configuracoes e clique em "Restaurar padrao".</div>

          <div style={S.faqQ}>Sistema lento no primeiro acesso</div>
          <div style={S.faqA}>Normal — cold start do Vercel Serverless. O primeiro request apos inatividade pode levar 3-5 segundos. Os seguintes sao rapidos.</div>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0 8px', color: 'var(--text-faint)', fontSize: 12, fontStyle: 'italic' }}>
          {BRAND.name} — {BRAND.promise}
        </div>
      </div>
    </div>
  )
}
