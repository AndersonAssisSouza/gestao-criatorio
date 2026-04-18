import { useEffect, useState } from 'react'
import { BRAND } from '../../brand'
import { cuponsService } from '../../services/cupons.service'
import './LandingPage.css'

const TIER_COLOR = { bronze: '#BCAAA4', prata: '#90A4AE', ouro: '#F5A623' }
const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

const TIERS = [
  {
    nome: 'Bronze',
    badge: '#BCAAA4',
    desc: 'Para quem está começando',
    desconto: 15,
    comissao: 20,
    duracao: 12,
    requisito: 'Qualquer pessoa',
    destaque: false,
  },
  {
    nome: 'Prata',
    badge: '#90A4AE',
    desc: 'Para divulgadores ativos',
    desconto: 20,
    comissao: 25,
    duracao: 12,
    requisito: '5+ indicações pagas',
    destaque: true,
  },
  {
    nome: 'Ouro',
    badge: '#F5A623',
    desc: 'Para influenciadores do nicho',
    desconto: 25,
    comissao: 30,
    duracao: 18,
    requisito: '20+ indicações pagas',
    destaque: false,
  },
]

export function AfiliadosPage({ onGoToLogin }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [ranking, setRanking] = useState(null)

  useEffect(() => {
    cuponsService.ranking().then(setRanking).catch(() => {})
  }, [])

  const mailto = () => {
    const subject = encodeURIComponent('Quero ser captador PLUMAR')
    const body = encodeURIComponent(
`Olá! Gostaria de participar do programa de indicações do PLUMAR.

Nome: ${name || '(preencha)'}
E-mail: ${email || '(preencha)'}

Como pretendo divulgar:
${mensagem || '(conte onde vai compartilhar: Instagram, YouTube, grupo de criadores, etc.)'}

Aguardo meu código personalizado.`
    )
    window.location.href = `mailto:plumarapp@plumar.com.br?subject=${subject}&body=${body}`
    setEnviado(true)
  }

  return (
    <div className="lp">
      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero__ambient" />
        <nav className="lp-nav">
          <span className="lp-nav__brand">{BRAND.name}</span>
          <button className="lp-nav__login" onClick={onGoToLogin}>Entrar</button>
        </nav>
        <div className="lp-hero__content">
          <h1 className="lp-hero__title">
            Ganhe indicando o <em>PLUMAR</em> para outros criadores
          </h1>
          <p className="lp-hero__sub">
            Programa de indicações com <strong>comissão recorrente</strong>.
            Um código personalizado, seu link próprio, dashboard em tempo real e saque via PIX.
          </p>
          <button className="lp-cta" onClick={() => document.getElementById('inscrever')?.scrollIntoView({ behavior: 'smooth' })}>
            Quero ser captador
          </button>
          <span className="lp-hero__note">Grátis · sem contrato · saque a partir de R$50</span>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="lp-section lp-section--light">
        <h2 className="lp-section__title">Como funciona em 4 passos</h2>
        <div className="lp-steps">
          <div className="lp-step"><span className="lp-step__num">1</span><h3>Solicite seu código</h3><p>Entre em contato e receba um cupom personalizado tipo <code>SEUNOME15</code>.</p></div>
          <div className="lp-step"><span className="lp-step__num">2</span><h3>Compartilhe seu link</h3><p>Poste nas redes sociais, grupos de criadores, WhatsApp. Link pronto para colar.</p></div>
          <div className="lp-step"><span className="lp-step__num">3</span><h3>Cliente ganha desconto</h3><p>Quem usa seu cupom ganha 15-25% de desconto na 1ª assinatura.</p></div>
          <div className="lp-step"><span className="lp-step__num">4</span><h3>Você recebe comissão</h3><p>20-30% do valor pago, <strong>todo mês</strong> enquanto o cliente mantiver a assinatura.</p></div>
        </div>
      </section>

      {/* TIERS */}
      <section className="lp-section">
        <h2 className="lp-section__title">Níveis de captador</h2>
        <p className="lp-section__sub">Quanto mais você indica, maior a comissão. Upgrade automático.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 980, margin: '30px auto 0' }}>
          {TIERS.map((t) => (
            <div key={t.nome} className="lp-feature-card" style={{
              border: t.destaque ? `3px solid ${t.badge}` : '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              paddingTop: t.destaque ? 36 : 24,
            }}>
              {t.destaque && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', background: t.badge, color: '#000', padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  MAIS POPULAR
                </div>
              )}
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.badge, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 700 }}>
                {t.nome[0]}
              </div>
              <h3 style={{ textAlign: 'center' }}>{t.nome}</h3>
              <p style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>{t.desc}</p>
              <div style={{ marginTop: 14, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: 13 }}>
                  <span>Desconto cliente</span><strong>{t.desconto}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: 13 }}>
                  <span>Comissão</span><strong>{t.comissao}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: 13 }}>
                  <span>Duração</span><strong>{t.duracao} meses</strong>
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: 12, marginTop: 12, color: '#aaa' }}><strong>Requisito:</strong> {t.requisito}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EXEMPLO DE GANHO */}
      <section className="lp-section lp-section--accent">
        <h2 className="lp-section__title lp-section__title--light">Quanto você pode ganhar?</h2>
        <div className="lp-highlight-box" style={{ color: '#fff' }}>
          <h3 style={{ color: '#FFD180' }}>Exemplo prático</h3>
          <p style={{ color: '#fff', fontSize: '1rem', opacity: 1 }}>
            Se você indicar <strong style={{ color: '#FFD180' }}>10 criadores no tier Bronze</strong> que contratam o plano mensal de R$ 29,90:
          </p>
          <ul style={{
            marginTop: 18, padding: 20, listStyle: 'none',
            background: 'rgba(0,0,0,0.25)', borderRadius: 10,
            fontSize: 16, lineHeight: 2, color: '#fff', textAlign: 'left',
            display: 'inline-block', maxWidth: 460,
          }}>
            <li style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              💰 Comissão por assinatura: <strong style={{ color: '#FFD180' }}>R$ 5,98/mês</strong>
            </li>
            <li style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              📅 Total mensal: <strong style={{ color: '#FFD180' }}>R$ 59,80</strong>
            </li>
            <li style={{ padding: '6px 0' }}>
              🏆 Em 12 meses: <strong style={{ color: '#4CFF9F', fontSize: 20 }}>R$ 717,60</strong>
              <span style={{ fontSize: 13, opacity: 0.85 }}> por apenas 10 indicações</span>
            </li>
          </ul>
          <p style={{ marginTop: 20, fontSize: 14, color: '#fff', opacity: 0.95 }}>
            Com <strong style={{ color: '#FFD180' }}>30 indicações no tier Prata</strong>, você pode gerar mais de{' '}
            <strong style={{ color: '#4CFF9F', fontSize: 16 }}>R$ 2.690/ano</strong> de renda passiva.
          </p>
        </div>
      </section>

      {/* RANKING */}
      {ranking && ranking.top?.length > 0 && (
        <section className="lp-section">
          <h2 className="lp-section__title">🏆 Top captadores do PLUMAR</h2>
          <p className="lp-section__sub">
            {ranking.stats.totalCaptadores} captador{ranking.stats.totalCaptadores !== 1 ? 'es' : ''} já estão ganhando.
            Juntos geraram <strong>{ranking.stats.totalIndicacoes}</strong> indicaç{ranking.stats.totalIndicacoes !== 1 ? 'ões' : 'ão'}.
          </p>
          <div style={{ maxWidth: 700, margin: '30px auto 0' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px', padding: '14px 18px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>Pos</div><div>Captador</div><div style={{ textAlign: 'center' }}>Tier</div><div style={{ textAlign: 'right' }}>Indicações</div>
              </div>
              {ranking.top.map((r) => (
                <div key={r.posicao} style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px',
                  padding: '14px 18px', alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: r.posicao <= 3 ? `rgba(245,166,35,${0.15 - r.posicao * 0.03})` : 'transparent',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: r.posicao <= 3 ? '#FFD180' : '#fff' }}>
                    {MEDAL[r.posicao] || `${r.posicao}º`}
                  </div>
                  <div style={{ color: '#fff', fontWeight: r.posicao <= 3 ? 700 : 500 }}>
                    {r.nome}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ background: TIER_COLOR[r.tier] || '#888', color: '#000', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {r.tier}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                    {r.totalIndicacoes}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Atualizado em tempo real · Nomes parcialmente ocultos por privacidade
            </p>
          </div>
        </section>
      )}

      {/* FORM / CTA */}
      <section className="lp-section lp-section--cta" id="inscrever">
        <h2 className="lp-section__title lp-section__title--light">Quero ser captador</h2>
        <p className="lp-section__sub lp-section__sub--light">
          Preencha os dados e envie um e-mail com sua proposta. Em até 48h você recebe seu código personalizado.
        </p>

        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
          <label style={{ display: 'block', marginTop: 14, color: '#fff', fontSize: 13 }}>Seu nome
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px 14px', marginTop: 4, border: 'none', borderRadius: 8, fontSize: 14 }} />
          </label>
          <label style={{ display: 'block', marginTop: 12, color: '#fff', fontSize: 13 }}>Seu e-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', marginTop: 4, border: 'none', borderRadius: 8, fontSize: 14 }} />
          </label>
          <label style={{ display: 'block', marginTop: 12, color: '#fff', fontSize: 13 }}>Como vai divulgar?
            <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} placeholder="Instagram com X seguidores, grupo de criadores no WhatsApp, canal no YouTube..." style={{ width: '100%', padding: '10px 14px', marginTop: 4, border: 'none', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
          </label>

          <button className="lp-cta lp-cta--light" style={{ marginTop: 20, width: '100%' }} onClick={mailto}>
            Enviar solicitação por e-mail
          </button>
          {enviado && (
            <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>
              ✉️ Se o seu cliente de e-mail não abriu, envie direto para <strong>plumarapp@plumar.com.br</strong>
            </div>
          )}
        </div>
      </section>

      <footer className="lp-footer">
        <p>{BRAND.name} &copy; 2026 · Programa de Indicações</p>
      </footer>
    </div>
  )
}
