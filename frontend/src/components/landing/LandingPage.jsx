import { BRAND } from '../../brand'
import { SocialFooter } from '../shared/SocialFooter'
import './LandingPage.css'

const FEATURES = [
  {
    icon: '🐦',
    title: 'Gestão de Plantel',
    desc: 'Cadastro completo com espécie, genética, idade, sexo e status reprodutivo. Ficha individual de cada ave.',
  },
  {
    icon: '🧬',
    title: 'Simulador Genético',
    desc: 'Simule cruzamentos e veja todas as mutações possíveis com probabilidades. Exclusivo no mercado.',
  },
  {
    icon: '🏠',
    title: 'Controle de Gaiolas',
    desc: 'Organize seu espaço físico. Saiba qual ave está em qual gaiola, casais formados e disponibilidade.',
  },
  {
    icon: '💍',
    title: 'Controle de Anilhas',
    desc: 'Rastreamento completo. Busca rápida, histórico e conformidade IBAMA/SISPASS.',
  },
  {
    icon: '🥚',
    title: 'Ciclos Reprodutivos',
    desc: 'Monitoramento de posturas, incubação e nascimentos. Do ovo ao filhote.',
  },
  {
    icon: '📊',
    title: 'Gestão Financeira',
    desc: 'Receitas, despesas e resultado do criatório. Saiba se está tendo lucro ou prejuízo.',
  },
]

const PAIN_POINTS = [
  {
    pain: 'Dados em planilhas que corrompem',
    painDetail: 'Linhagens perdidas, histórico apagado, anos de trabalho jogados fora.',
    solution: 'Dados seguros na nuvem',
    solutionDetail: 'Tudo centralizado, com backup, acessível do celular ou computador.',
  },
  {
    pain: 'Cruzamentos no achismo',
    painDetail: 'Sem saber quais mutações podem sair de cada casal.',
    solution: 'Simulador genético com probabilidades',
    solutionDetail: 'Veja todos os resultados possíveis antes de formar o casal.',
  },
  {
    pain: 'Anilhas em cadernos e papéis soltos',
    painDetail: 'Risco de perda, erro e problema com fiscalização.',
    solution: 'Controle digital de anilhas',
    solutionDetail: 'Busca rápida, rastreabilidade completa, pronto para SISPASS.',
  },
  {
    pain: 'Sem saber o custo real do criatório',
    painDetail: 'Gastos com ração, medicamentos e estrutura sem controle.',
    solution: 'Dashboard financeiro automático',
    solutionDetail: 'Receitas, despesas e resultado — tudo visível em tempo real.',
  },
]

const STEPS = [
  { num: '1', title: 'Crie sua conta', desc: 'Cadastro rápido, sem cartão. 30 dias grátis com acesso completo a todos os recursos.' },
  { num: '2', title: 'Cadastre seu plantel', desc: 'Adicione suas aves com dados genéticos em poucos minutos.' },
  { num: '3', title: 'Gerencie e simule', desc: 'Simulador genético, anilhas, reprodução e finanças num só lugar.' },
]

export function LandingPage({ onGoToLogin }) {
  const scrollToCadastro = () => {
    document.getElementById('lp-cadastro')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="lp">
      {/* ───── HERO ───── */}
      <section className="lp-hero">
        <div className="lp-hero__ambient" />
        <nav className="lp-nav">
          <span className="lp-nav__brand">{BRAND.name}</span>
          <button className="lp-nav__login" onClick={onGoToLogin}>Entrar</button>
        </nav>
        <div className="lp-hero__content">
          <h1 className="lp-hero__title">
            O primeiro sistema com <em>simulador genético</em> integrado para criadores de aves
          </h1>
          <p className="lp-hero__sub">
            Controle plantel, genética, anilhas, reprodução e finanças em um só lugar.
            <br />Feito por criador, para criador.
          </p>
          <button className="lp-cta" onClick={scrollToCadastro}>
            Teste Grátis por 30 Dias
          </button>
          <span className="lp-hero__note">Sem cartão de crédito. Cancele quando quiser.</span>
        </div>
      </section>

      {/* ───── PAIN vs SOLUTION ───── */}
      <section className="lp-section lp-section--light">
        <h2 className="lp-section__title">Chega de improvisar</h2>
        <p className="lp-section__sub">Se você se identificou com algum desses problemas, o PLUMAR foi feito pra você.</p>
        <div className="lp-pain-grid">
          {PAIN_POINTS.map((pp, i) => (
            <div className="lp-pain-row" key={i}>
              <div className="lp-pain-card lp-pain-card--pain">
                <span className="lp-pain-card__icon">✕</span>
                <div>
                  <strong>{pp.pain}</strong>
                  <p>{pp.painDetail}</p>
                </div>
              </div>
              <div className="lp-pain-card lp-pain-card--solution">
                <span className="lp-pain-card__icon lp-pain-card__icon--ok">✓</span>
                <div>
                  <strong>{pp.solution}</strong>
                  <p>{pp.solutionDetail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section className="lp-section">
        <h2 className="lp-section__title">Tudo que seu criatório precisa</h2>
        <p className="lp-section__sub">Um sistema completo, pensado para a rotina real do criador brasileiro.</p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div className="lp-feature-card" key={i}>
              <span className="lp-feature-card__icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── SIMULADOR DESTAQUE ───── */}
      <section className="lp-section lp-section--accent">
        <h2 className="lp-section__title lp-section__title--light">Por que o PLUMAR é diferente?</h2>
        <p className="lp-section__sub lp-section__sub--light">
          Existem planilhas. Existem apps genéricos de fazenda. Mas nenhum foi projetado especificamente para o criador de aves.
        </p>
        <div className="lp-highlight-box">
          <h3>Simulador Genético de Mutações</h3>
          <p>
            A funcionalidade que nenhum outro sistema oferece. Selecione macho e fêmea,
            informe as mutações, e veja em segundos todos os resultados possíveis com
            percentuais de probabilidade. Planeje seus casais com inteligência.
          </p>
        </div>
      </section>

      {/* ───── COMO FUNCIONA ───── */}
      <section className="lp-section lp-section--light">
        <h2 className="lp-section__title">Comece em 3 passos</h2>
        <p className="lp-section__sub">Do cadastro ao controle total em minutos.</p>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.num}>
              <span className="lp-step__num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── PROVA SOCIAL ───── */}
      <section className="lp-section">
        <h2 className="lp-section__title">Criado por criador, para criadores</h2>
        <p className="lp-section__sub">Desenvolvido por quem vive a rotina do criatório todos os dias.</p>
        <div className="lp-stats">
          <div className="lp-stat">
            <span className="lp-stat__num">6+</span>
            <span className="lp-stat__label">Módulos integrados</span>
          </div>
          <div className="lp-stat">
            <span className="lp-stat__num">30</span>
            <span className="lp-stat__label">Dias de trial grátis</span>
          </div>
          <div className="lp-stat">
            <span className="lp-stat__num">100%</span>
            <span className="lp-stat__label">Web — qualquer dispositivo</span>
          </div>
        </div>
        <blockquote className="lp-testimonial">
          <p>
            "O simulador genético sozinho já justifica o sistema. Parei de consultar tabelas
            e agora planejo meus casais com dados concretos."
          </p>
          <cite>— Beta tester, criador de canários de cor</cite>
        </blockquote>
      </section>

      {/* ───── COMO FUNCIONA O ACESSO ───── */}
      <section className="lp-section lp-section--light">
        <h2 className="lp-section__title">Planos e acesso</h2>
        <p className="lp-section__sub">Comece grátis. Assine quando seu criatório crescer.</p>
        <div className="lp-pain-grid">
          <div className="lp-pain-row">
            <div className="lp-pain-card lp-pain-card--solution">
              <span className="lp-pain-card__icon lp-pain-card__icon--ok">🎁</span>
              <div>
                <strong>30 dias grátis — acesso completo</strong>
                <p>Todos os módulos liberados, sem cartão. Tempo suficiente para importar seu plantel e testar tudo.</p>
              </div>
            </div>
            <div className="lp-pain-card lp-pain-card--solution">
              <span className="lp-pain-card__icon lp-pain-card__icon--ok">✓</span>
              <div>
                <strong>Depois dos 30 dias — plano gratuito</strong>
                <p>Seus dados ficam salvos. Você continua podendo cadastrar até <strong>1 gaiola</strong>, <strong>2 aves</strong> e <strong>1 ninhada</strong> gratuitamente.</p>
              </div>
            </div>
            <div className="lp-pain-card lp-pain-card--solution">
              <span className="lp-pain-card__icon lp-pain-card__icon--ok">⭐</span>
              <div>
                <strong>Assinatura — acesso ilimitado</strong>
                <p>Mensal ou anual. Libere cadastros ilimitados, simulador genético, financeiro e todos os módulos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA FINAL ───── */}
      <section className="lp-section lp-section--cta" id="lp-cadastro">
        <h2 className="lp-section__title lp-section__title--light">
          Pronto para profissionalizar seu criatório?
        </h2>
        <p className="lp-section__sub lp-section__sub--light">
          Teste o PLUMAR por 30 dias, sem compromisso. Depois continue no plano gratuito com 1 gaiola, 2 aves e 1 ninhada — ou assine para liberar tudo.
        </p>
        <button className="lp-cta lp-cta--light" onClick={onGoToLogin}>
          Criar Conta Grátis
        </button>
        <span className="lp-hero__note" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Sem cartão de crédito. Sem pegadinhas.
        </span>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="lp-footer">
        <p>{BRAND.name} &copy; 2026 — {BRAND.descriptor}</p>
        <SocialFooter variant="dark" />
      </footer>
    </div>
  )
}
