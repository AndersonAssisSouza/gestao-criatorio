import { useState } from 'react'
import { BRAND } from '../../../brand'

/* ------------------------------------------------------------------ */
/*  Sumario lateral                                                   */
/* ------------------------------------------------------------------ */
const SECTIONS = [
  { id: 'inicio',        label: 'Primeiros Passos' },
  { id: 'navegacao',     label: 'Navegacao e Interface' },
  { id: 'plantel',       label: 'Plantel' },
  { id: 'chocando',      label: 'Aves em Choco' },
  { id: 'gaiolas',       label: 'Gaiolas' },
  { id: 'filhotes',      label: 'Filhotes' },
  { id: 'especies',      label: 'Especies' },
  { id: 'criatorios',    label: 'Criatorios' },
  { id: 'aneis',         label: 'Aneis' },
  { id: 'financeiro',    label: 'Financeiro' },
  { id: 'explantel',     label: 'Ex-Plantel' },
  { id: 'assinatura',    label: 'Assinatura' },
  { id: 'configuracoes', label: 'Configuracoes' },
  { id: 'faq',           label: 'Perguntas Frequentes' },
]

/* ------------------------------------------------------------------ */
/*  Helpers de estilo                                                 */
/* ------------------------------------------------------------------ */
const S = {
  wrapper: {
    display: 'flex',
    gap: 28,
    alignItems: 'flex-start',
  },
  nav: {
    position: 'sticky',
    top: 12,
    flex: '0 0 200px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    background: 'var(--bg-panel-solid)',
    borderRadius: 12,
    border: '1px solid var(--line-soft)',
    padding: '14px 10px',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  },
  navBtn: (active) => ({
    background: active ? 'var(--accent-ghost)' : 'transparent',
    border: 'none',
    borderRadius: 8,
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: active ? 700 : 400,
    color: active ? 'var(--accent)' : 'var(--text-soft)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    letterSpacing: '0.01em',
  }),
  content: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    background: 'var(--bg-panel-solid)',
    borderRadius: 14,
    border: '1px solid var(--line-soft)',
    padding: '28px 32px',
    marginBottom: 20,
  },
  h2: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    fontWeight: 400,
    color: 'var(--text-main)',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '1px solid var(--line-soft)',
  },
  h3: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-main)',
    marginTop: 20,
    marginBottom: 8,
  },
  p: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.7,
    marginBottom: 10,
  },
  ol: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.8,
    paddingLeft: 22,
    marginBottom: 10,
  },
  ul: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.8,
    paddingLeft: 22,
    marginBottom: 10,
    listStyleType: 'disc',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
    marginBottom: 14,
  },
  th: {
    background: 'var(--bg-deep)',
    padding: '8px 12px',
    fontWeight: 700,
    textAlign: 'left',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    borderBottom: '2px solid var(--line-soft)',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--line-soft)',
    color: 'var(--text-soft)',
    verticalAlign: 'top',
  },
  badge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: 20,
    background: 'var(--accent-ghost)',
    color: 'var(--accent)',
  },
  strong: {
    fontWeight: 600,
    color: 'var(--text-main)',
  },
  faqQ: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--accent)',
    marginTop: 14,
    marginBottom: 4,
  },
  faqA: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.7,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeft: '3px solid var(--accent-ghost)',
  },
}

/* ------------------------------------------------------------------ */
/*  Componente auxiliar de tabela                                      */
/* ------------------------------------------------------------------ */
function T({ cols, rows }) {
  return (
    <table style={S.table}>
      <thead>
        <tr>{cols.map((c, i) => <th key={i} style={S.th}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={S.td}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------------ */
/*  Modulo principal                                                  */
/* ------------------------------------------------------------------ */
export function AjudaModule() {
  const [active, setActive] = useState('inicio')

  const scrollTo = (id) => {
    setActive(id)
    const el = document.getElementById(`ajuda-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page-block">
      <section className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Suporte</div>
          <h2 className="module-hero__title">Central de Ajuda</h2>
          <div className="module-hero__text">
            Manual completo do {BRAND.shortName}. Encontre aqui tudo sobre cada modulo, cadastros, navegacao e dicas de uso.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="pill">Manual do Usuario</span>
        </div>
      </section>

      <div style={S.wrapper}>
        {/* Sidebar de navegacao - oculta em mobile */}
        <nav style={S.nav} className="ajuda-nav">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', padding: '0 12px 8px', borderBottom: '1px solid var(--line-soft)', marginBottom: 6 }}>
            Sumario
          </div>
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" style={S.navBtn(active === s.id)} onClick={() => scrollTo(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Conteudo */}
        <div style={S.content}>

          {/* 1 - Primeiros Passos */}
          <div id="ajuda-inicio" style={S.section}>
            <h2 style={S.h2}>1. Primeiros Passos</h2>

            <h3 style={S.h3}>Criando sua conta</h3>
            <ol style={S.ol}>
              <li>Acesse o sistema e clique em <strong style={S.strong}>"Criar conta"</strong></li>
              <li>Preencha <strong style={S.strong}>Nome</strong> (3 a 80 caracteres), <strong style={S.strong}>E-mail</strong> e <strong style={S.strong}>Senha</strong> (minimo 8 caracteres com letras e numeros)</li>
              <li>Clique em <strong style={S.strong}>"Criar conta e entrar"</strong></li>
            </ol>
            <p style={S.p}>Ao criar sua conta, voce recebe automaticamente <span style={S.badge}>30 dias gratuitos</span> com acesso completo a todas as funcionalidades — sem cartao de credito.</p>

            <h3 style={S.h3}>Fazendo login</h3>
            <ol style={S.ol}>
              <li>Informe seu <strong style={S.strong}>e-mail</strong> e <strong style={S.strong}>senha</strong></li>
              <li>Clique em <strong style={S.strong}>"Entrar"</strong></li>
            </ol>

            <h3 style={S.h3}>Esqueci minha senha</h3>
            <ol style={S.ol}>
              <li>Na tela de login, clique em <strong style={S.strong}>"Esqueci minha senha"</strong></li>
              <li>Informe o e-mail cadastrado e clique em <strong style={S.strong}>"Enviar instrucoes"</strong></li>
              <li>Verifique seu e-mail e clique no link de recuperacao</li>
              <li>Defina uma nova senha e confirme</li>
              <li>Clique em <strong style={S.strong}>"Salvar nova senha"</strong></li>
            </ol>
            <p style={S.p}>O link de recuperacao expira em <strong style={S.strong}>60 minutos</strong>.</p>
          </div>

          {/* 2 - Navegacao */}
          <div id="ajuda-navegacao" style={S.section}>
            <h2 style={S.h2}>2. Navegacao e Interface</h2>

            <h3 style={S.h3}>Barra lateral (Sidebar)</h3>
            <p style={S.p}>O menu principal e organizado em grupos:</p>
            <T cols={['Grupo', 'Modulos']} rows={[
              ['Manejo', 'Plantel, Aves em Choco, Gaiolas, Filhotes'],
              ['Cadastros', 'Especies, Criatorios, Aneis'],
              ['Analise', 'Financeiro, Ex-Plantel'],
              ['Sistema', 'Assinatura, Ajuda, Configuracoes'],
            ]} />
            <p style={S.p}>No rodape da barra lateral voce ve seu avatar, nome, status da assinatura e o botao de sair.</p>

            <h3 style={S.h3}>Periodo de teste e acesso limitado</h3>
            <p style={S.p}>Durante os <strong style={S.strong}>30 dias gratuitos</strong> voce tem acesso completo a todos os modulos, sem limites.</p>
            <p style={S.p}>Apos o termino do teste, caso nao contrate uma assinatura, sua conta entra em <strong style={S.strong}>modo gratuito limitado</strong>:</p>
            <ul style={S.ul}>
              <li>Voce pode manter cadastrados ate <strong style={S.strong}>1 gaiola</strong>, <strong style={S.strong}>2 aves</strong> e <strong style={S.strong}>1 ninhada</strong></li>
              <li>Tentar cadastrar acima desses limites sera bloqueado com aviso para contratar um plano</li>
              <li>Os modulos continuam navegaveis para consulta dos dados existentes</li>
              <li>Um banner laranja aparece no topo indicando o status e o atalho para assinar</li>
              <li>Seus dados ficam preservados — assim que contratar um plano, tudo e liberado imediatamente</li>
            </ul>

            <h3 style={S.h3}>Dispositivos moveis</h3>
            <p style={S.p}>No celular, a barra lateral e substituida por uma barra de navegacao inferior (dock). Toque no icone de menu para abrir o menu completo.</p>

            <h3 style={S.h3}>Formularios</h3>
            <ul style={S.ul}>
              <li>Clique no botao <strong style={S.strong}>"+"</strong> ou <strong style={S.strong}>"Novo"</strong> para abrir o formulario</li>
              <li>Preencha os campos obrigatorios</li>
              <li>Clique em <strong style={S.strong}>"Salvar"</strong> para confirmar ou <strong style={S.strong}>"Cancelar"</strong> para descartar</li>
              <li>Para editar, clique no botao de edicao na tabela</li>
              <li>Para excluir, clique no botao de exclusao</li>
            </ul>
          </div>

          {/* 3 - Plantel */}
          <div id="ajuda-plantel" style={S.section}>
            <h2 style={S.h2}>3. Plantel — Aves Ativas</h2>
            <p style={S.p}>O modulo Plantel e o coracao do sistema. Gerencie todas as aves ativas do criatorio.</p>

            <h3 style={S.h3}>Painel de estatisticas</h3>
            <ul style={S.ul}>
              <li><strong style={S.strong}>Total de aves</strong> (somente vivas)</li>
              <li><strong style={S.strong}>Machos</strong> e <strong style={S.strong}>Femeas</strong> (quantidade)</li>
              <li><strong style={S.strong}>Gaiolas ativas</strong> (em uso)</li>
            </ul>

            <h3 style={S.h3}>Campos do cadastro</h3>
            <T cols={['Campo', 'Descricao', 'Obrigatorio']} rows={[
              ['Nome', 'Nome da ave', 'Sim'],
              ['Categoria', 'Canario, Pintassilgo, Tarim, Coleiro ou Outro', 'Nao'],
              ['Genero', 'Macho, Femea ou Indeterminado', 'Nao'],
              ['Status', 'Ativo, Chocando ou Inativo', 'Nao'],
              ['Gaiola', 'Codigo da gaiola', 'Nao'],
              ['Nome da Mae', 'Nome da mae (se conhecida)', 'Nao'],
              ['Nome do Pai', 'Nome do pai (se conhecido)', 'Nao'],
              ['Data de Nascimento', 'Data de nascimento ou estimativa', 'Nao'],
              ['Origem', 'Nascido no criatorio, Adquirida, Adquirido ou Doacao', 'Nao'],
              ['Registro FOB', 'Numero do registro na FOB', 'Nao'],
              ['Anel Esquerdo', 'Identificacao do anel/anilha', 'Nao'],
            ]} />

            <h3 style={S.h3}>Busca</h3>
            <p style={S.p}>Use o campo de busca no topo para filtrar aves pelo nome. A busca nao diferencia maiusculas de minusculas.</p>
          </div>

          {/* 4 - Chocando */}
          <div id="ajuda-chocando" style={S.section}>
            <h2 style={S.h2}>4. Aves em Choco — Ciclos Reprodutivos</h2>
            <p style={S.p}>Monitore casais em reproducao, posturas e o andamento dos ciclos de choco.</p>

            <h3 style={S.h3}>Campos do cadastro</h3>
            <T cols={['Campo', 'Descricao']} rows={[
              ['Nome da Ave', 'Nome da ave em choco'],
              ['Categoria', 'Especie da ave'],
              ['Gaiola', 'Gaiola do casal'],
              ['Data de Inicio', 'Quando o choco comecou'],
              ['Previsao Eclosao', 'Data prevista para eclosao'],
              ['Quantidade de Ovos', 'Total de ovos na postura'],
              ['Ovos Ferteis', 'Quantos ovos sao ferteis'],
              ['Status', 'Em Choco, Eclodido ou Abandonado'],
              ['Observacoes', 'Anotacoes sobre o ciclo'],
            ]} />

            <h3 style={S.h3}>Status do ciclo</h3>
            <ul style={S.ul}>
              <li><strong style={S.strong}>Em Choco</strong> — A ave esta chocando os ovos</li>
              <li><strong style={S.strong}>Eclodido</strong> — Os ovos eclodiram com sucesso</li>
              <li><strong style={S.strong}>Abandonado</strong> — O ninho foi abandonado</li>
            </ul>

            <h3 style={S.h3}>Tempo de choco por especie</h3>
            <p style={S.p}><strong style={S.strong}>Tarim</strong>: 13 dias | <strong style={S.strong}>Canario Belga</strong>: 13 dias</p>
          </div>

          {/* 5 - Gaiolas */}
          <div id="ajuda-gaiolas" style={S.section}>
            <h2 style={S.h2}>5. Gaiolas — Gestao de Gaiolas</h2>
            <p style={S.p}>Gerencie todas as gaiolas, suas capacidades e ocupacoes.</p>

            <h3 style={S.h3}>Campos do cadastro</h3>
            <T cols={['Campo', 'Descricao']} rows={[
              ['Codigo da Gaiola', 'Identificacao unica (ex: 001, 002)'],
              ['Tipo', 'Voo, Choco, Reproducao ou Exposicao'],
              ['Localizacao', 'Onde a gaiola esta no criatorio'],
              ['Capacidade', 'Numero maximo de aves'],
              ['Ocupacao Atual', 'Quantas aves estao na gaiola'],
              ['Status', 'Disponivel, Ocupada ou Manutencao'],
              ['Ultima Limpeza', 'Data da ultima higienizacao'],
              ['Observacoes', 'Anotacoes adicionais'],
            ]} />

            <h3 style={S.h3}>Status da gaiola</h3>
            <ul style={S.ul}>
              <li><strong style={S.strong}>Disponivel</strong> — Vazia e pronta para uso</li>
              <li><strong style={S.strong}>Ocupada</strong> — Com aves alocadas</li>
              <li><strong style={S.strong}>Manutencao</strong> — Em limpeza ou reparo</li>
            </ul>
          </div>

          {/* 6 - Filhotes */}
          <div id="ajuda-filhotes" style={S.section}>
            <h2 style={S.h2}>6. Filhotes — Nascimentos e Desenvolvimento</h2>
            <p style={S.p}>Acompanhe filhotes desde o nascimento ate a introducao no plantel.</p>

            <h3 style={S.h3}>Campos do cadastro</h3>
            <T cols={['Campo', 'Descricao']} rows={[
              ['Nome / ID Temporario', 'Identificacao do filhote'],
              ['Categoria', 'Especie'],
              ['Status', 'Em Desenvolvimento, Desmamado, Transferido ou Obito'],
              ['Data de Nascimento', 'Data de nascimento'],
              ['Gaiola', 'Gaiola atual'],
              ['Nome da Mae / Pai', 'Pais do filhote'],
              ['Anelamento', 'Informacao da anilha'],
              ['Peso (g)', 'Peso em gramas'],
              ['Destino', 'Plantel, Venda, Doacao ou nao definido'],
              ['Observacoes', 'Anotacoes sobre o filhote'],
            ]} />

            <h3 style={S.h3}>Ciclo de vida</h3>
            <ol style={S.ol}>
              <li><strong style={S.strong}>Em Desenvolvimento</strong> — Recem-nascido, ainda no ninho</li>
              <li><strong style={S.strong}>Desmamado</strong> — Ja come sozinho</li>
              <li><strong style={S.strong}>Transferido para Plantel</strong> — Promovido ao plantel</li>
              <li><strong style={S.strong}>Obito</strong> — Registro de falecimento</li>
            </ol>

            <h3 style={S.h3}>Informacoes geneticas</h3>
            <p style={S.p}>Badges coloridos exibem as mutacoes esperadas dos filhotes, calculadas automaticamente com base nas mutacoes dos pais.</p>
          </div>

          {/* 7 - Especies */}
          <div id="ajuda-especies" style={S.section}>
            <h2 style={S.h2}>7. Especies — Catalogo Taxonomico</h2>
            <p style={S.p}>Mantenha um catalogo organizado de todas as especies do criatorio.</p>

            <T cols={['Campo', 'Descricao']} rows={[
              ['Nome Comum', 'Nome popular (ex: Tarim)'],
              ['Nome Cientifico', 'Classificacao cientifica'],
              ['Familia', 'Familia taxonomica'],
              ['Cor Predominante', 'Coloracao principal'],
              ['Qtd. no Plantel', 'Quantidade de aves dessa especie'],
              ['Tamanho Medio (cm)', 'Comprimento medio'],
              ['Dieta Principal', 'Granivora, Onivora, Frugivora ou Insetivora'],
              ['Status Conservacao', 'Comum, Quase Ameacada ou Vulneravel'],
            ]} />
          </div>

          {/* 8 - Criatorios */}
          <div id="ajuda-criatorios" style={S.section}>
            <h2 style={S.h2}>8. Criatorios — Espacos Fisicos</h2>
            <p style={S.p}>Gerencie os espacos fisicos de reproducao e condicoes ambientais.</p>

            <T cols={['Campo', 'Descricao']} rows={[
              ['Nome do Espaco', 'Identificacao do espaco'],
              ['Tipo', 'Sala Interna, Viveiro Externo ou Quarentena'],
              ['Area (m2)', 'Metragem do espaco'],
              ['Capacidade de Gaiolas', 'Maximo de gaiolas'],
              ['Gaiolas Instaladas', 'Gaiolas atualmente instaladas'],
              ['Temperatura Media', 'Temperatura do ambiente'],
              ['Umidade Media', 'Umidade relativa'],
              ['Iluminacao', 'Natural, Artificial ou Mista'],
              ['Status', 'Ativo, Inativo ou Reforma'],
            ]} />
          </div>

          {/* 9 - Aneis */}
          <div id="ajuda-aneis" style={S.section}>
            <h2 style={S.h2}>9. Aneis — Controle de Anilhas</h2>
            <p style={S.p}>Rastreie todas as anilhas do criatorio e sua disponibilidade.</p>

            <T cols={['Campo', 'Descricao']} rows={[
              ['Codigo do Anel', 'Identificacao unica'],
              ['Tipo', 'IBAMA, FOB ou Criadouro'],
              ['Diametro (mm)', 'Tamanho da anilha'],
              ['Cor', 'Cor da anilha'],
              ['Ave Associada', 'Ave que esta usando o anel'],
              ['Data de Colocacao', 'Quando foi colocado'],
              ['Lote', 'Numero do lote'],
              ['Status', 'Utilizado, Disponivel ou Extraviado'],
            ]} />

            <h3 style={S.h3}>Tipos de anel</h3>
            <ul style={S.ul}>
              <li><strong style={S.strong}>IBAMA</strong> — Anilha governamental</li>
              <li><strong style={S.strong}>FOB</strong> — Federacao Ornitologica do Brasil</li>
              <li><strong style={S.strong}>Criadouro</strong> — Emitida pelo proprio criador</li>
            </ul>
          </div>

          {/* 10 - Financeiro */}
          <div id="ajuda-financeiro" style={S.section}>
            <h2 style={S.h2}>10. Financeiro — Receitas e Despesas</h2>
            <p style={S.p}>Controle todas as movimentacoes financeiras do criatorio.</p>

            <T cols={['Campo', 'Descricao']} rows={[
              ['Descricao', 'Detalhamento da transacao'],
              ['Tipo', 'Receita (entrada) ou Despesa (saida)'],
              ['Categoria', 'Venda de Ave, Racao, Medicamento, Equipamento, Aneis, Manutencao ou Outros'],
              ['Valor (R$)', 'Valor da transacao'],
              ['Data', 'Data da movimentacao'],
              ['Forma de Pagamento', 'Dinheiro, PIX, Cartao ou Transferencia'],
              ['Status', 'Pago, Pendente ou Cancelado'],
              ['Ave Relacionada', 'Ave vinculada (opcional)'],
              ['Nota Fiscal', 'Numero do documento fiscal (opcional)'],
            ]} />

            <h3 style={S.h3}>Visualizacao</h3>
            <ul style={S.ul}>
              <li><span style={{ color: '#4CAF7D', fontWeight: 600 }}>Receitas</span> aparecem em verde com prefixo <strong style={S.strong}>+</strong></li>
              <li><span style={{ color: '#E05C4B', fontWeight: 600 }}>Despesas</span> aparecem em vermelho com prefixo <strong style={S.strong}>-</strong></li>
              <li>Valores formatados como moeda brasileira (R$)</li>
            </ul>
          </div>

          {/* 11 - Ex-Plantel */}
          <div id="ajuda-explantel" style={S.section}>
            <h2 style={S.h2}>11. Ex-Plantel — Aves que Sairam</h2>
            <p style={S.p}>Registre e consulte aves que sairam do criatorio.</p>

            <T cols={['Campo', 'Descricao']} rows={[
              ['Nome', 'Nome da ave'],
              ['Categoria', 'Especie'],
              ['Genero', 'Macho, Femea ou Indeterminado'],
              ['Motivo da Saida', 'Venda, Doacao, Obito, Fuga ou Outro'],
              ['Data de Saida', 'Data em que a ave saiu'],
              ['Destinatario', 'Para quem foi a ave'],
              ['Valor (R$)', 'Valor da venda (se aplicavel)'],
              ['Registro FOB', 'Numero do registro'],
              ['Anel Esquerdo', 'Identificacao do anel'],
              ['Ultima Gaiola', 'Ultima gaiola antes da saida'],
              ['Observacoes', 'Detalhes sobre a saida'],
            ]} />
          </div>

          {/* 12 - Assinatura */}
          <div id="ajuda-assinatura" style={S.section}>
            <h2 style={S.h2}>12. Assinatura — Planos e Pagamento</h2>

            <h3 style={S.h3}>Planos disponiveis</h3>
            <T cols={['Plano', 'Valor', 'Duracao']} rows={[
              ['Mensal', 'R$ 29,90', '30 dias'],
              ['Anual', 'R$ 299,00', '12 meses'],
            ]} />

            <h3 style={S.h3}>Painel de status</h3>
            <ul style={S.ul}>
              <li><strong style={S.strong}>Status</strong> — Se o acesso esta liberado ou bloqueado</li>
              <li><strong style={S.strong}>Plano</strong> — Qual plano esta ativo</li>
              <li><strong style={S.strong}>Valido ate</strong> — Data de expiracao ou dias restantes do teste</li>
            </ul>

            <h3 style={S.h3}>Como assinar</h3>
            <ol style={S.ol}>
              <li>Acesse o modulo <strong style={S.strong}>Assinatura</strong></li>
              <li>Escolha entre <strong style={S.strong}>Mensal</strong> ou <strong style={S.strong}>Anual</strong></li>
              <li>Selecione PIX ou Cartao</li>
              <li>Clique em <strong style={S.strong}>"Pagar via MercadoPago"</strong></li>
              <li>Conclua o pagamento na plataforma do MercadoPago</li>
              <li>Ao retornar, o sistema verifica automaticamente o pagamento</li>
            </ol>

            <h3 style={S.h3}>Status do pagamento</h3>
            <ul style={S.ul}>
              <li><strong style={S.strong}>Aguardando pagamento</strong> — Checkout criado, pendente</li>
              <li><strong style={S.strong}>Processando</strong> — Em analise</li>
              <li><strong style={S.strong}>Pago</strong> — Confirmado, acesso liberado</li>
              <li><strong style={S.strong}>Rejeitado</strong> — Pagamento recusado</li>
            </ul>
          </div>

          {/* 13 - Configuracoes */}
          <div id="ajuda-configuracoes" style={S.section}>
            <h2 style={S.h2}>13. Configuracoes — Personalizacao Visual</h2>
            <p style={S.p}>Personalize as cores do sistema de acordo com a sua preferencia.</p>

            <T cols={['Configuracao', 'Descricao']} rows={[
              ['Cor principal', 'Botoes, destaques e indicadores'],
              ['Gradiente da marca', 'Profundidade de botoes'],
              ['Cor de apoio', 'Tom complementar secundario'],
              ['Fundo principal', 'Fundo de toda a aplicacao'],
              ['Fundo profundo', 'Camadas de sombra'],
              ['Paineis e cards', 'Sidebar, cartoes e superficies'],
            ]} />

            <h3 style={S.h3}>Como personalizar</h3>
            <ol style={S.ol}>
              <li>Acesse <strong style={S.strong}>Configuracoes</strong> no menu lateral</li>
              <li>Clique no seletor de cor ao lado de cada item</li>
              <li>Escolha a cor desejada ou digite o codigo hexadecimal</li>
              <li>A pre-visualizacao atualiza em tempo real</li>
              <li>As cores sao salvas automaticamente no seu navegador</li>
            </ol>
            <p style={S.p}>Clique em <strong style={S.strong}>"Restaurar padrao"</strong> para voltar as cores originais.</p>
          </div>

          {/* 14 - FAQ */}
          <div id="ajuda-faq" style={S.section}>
            <h2 style={S.h2}>14. Perguntas Frequentes</h2>

            <div style={S.faqQ}>Quanto tempo dura o teste gratuito?</div>
            <div style={S.faqA}>30 dias com acesso completo a todos os modulos, sem precisar de cartao de credito.</div>

            <div style={S.faqQ}>O que acontece quando meu periodo de teste de 30 dias acaba?</div>
            <div style={S.faqA}>Sua conta entra em modo gratuito limitado: voce pode manter cadastrados ate 1 gaiola, 2 aves e 1 ninhada. Cadastros acima desses limites sao bloqueados ate voce contratar um plano. Seus dados sao preservados e o acesso completo e restaurado imediatamente apos a assinatura.</div>

            <div style={S.faqQ}>Meus dados sao apagados depois dos 30 dias?</div>
            <div style={S.faqA}>Nao. Tudo continua salvo. Voce nao perde nada — apenas os limites do modo gratuito passam a valer para novos cadastros.</div>

            <div style={S.faqQ}>Posso mudar minha senha?</div>
            <div style={S.faqA}>Sim. Na tela de login, clique em "Esqueci minha senha" e siga o processo de recuperacao.</div>

            <div style={S.faqQ}>Minhas configuracoes de cores sao salvas na nuvem?</div>
            <div style={S.faqA}>Nao. As cores sao salvas localmente no seu navegador. Se trocar de navegador ou dispositivo, precisara configurar novamente.</div>

            <div style={S.faqQ}>Posso acessar de varios dispositivos?</div>
            <div style={S.faqA}>Sim. Basta fazer login com seu e-mail e senha em qualquer navegador.</div>

            <div style={S.faqQ}>O que e o Registro FOB?</div>
            <div style={S.faqA}>E o numero de registro na Federacao Ornitologica do Brasil, entidade que regulamenta criatorios de aves no pais.</div>

            <div style={S.faqQ}>O que sao as categorias IBAMA, FOB e Criadouro nos aneis?</div>
            <div style={S.faqA}>Sao os tipos de anilha — IBAMA (governamental), FOB (federacao) e Criadouro (emitida pelo proprio criador).</div>

            <div style={S.faqQ}>Como funciona o pagamento via MercadoPago?</div>
            <div style={S.faqA}>Voce e redirecionado para a plataforma segura do MercadoPago para concluir o pagamento via PIX ou Cartao. Apos a conclusao, retorna automaticamente ao sistema com o acesso liberado.</div>

            <div style={S.faqQ}>O sistema demora para carregar na primeira vez?</div>
            <div style={S.faqA}>Sim, e normal. O backend usa Vercel Serverless e o primeiro acesso apos inatividade pode levar 3-5 segundos (cold start). Os acessos seguintes sao rapidos.</div>
          </div>

          {/* Rodape */}
          <div style={{ textAlign: 'center', padding: '16px 0 8px', color: 'var(--text-faint)', fontSize: 12, fontStyle: 'italic' }}>
            {BRAND.name} — {BRAND.promise}
          </div>
        </div>
      </div>
    </div>
  )
}
