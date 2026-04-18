import { useState } from 'react'

const TEMPLATES = [
  {
    titulo: '💬 WhatsApp / Direct',
    icone: '💬',
    cor: '#25D366',
    texto: (link, codigo, desc) =>
`Oi! Estou usando o PLUMAR — um sistema incrível pra gestão de criatório. Tem simulador genético, controle de plantel, anilhas, financeiro — tudo num lugar só.

Se quiser testar, usa meu cupom *${codigo}* e ganha ${desc}% OFF:
${link}

Vale MUITO a pena pra quem leva o criatório a sério 🐦`,
    share: (link, texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`,
  },
  {
    titulo: '📸 Instagram / Feed',
    icone: '📸',
    cor: '#E1306C',
    texto: (link, codigo, desc) =>
`Criador de aves, essa dica é pra você 🐦✨

Chega de planilha bagunçada e cruzamento no achismo. O @plumar.app organiza TUDO do seu criatório:

✅ Plantel completo (espécie, genética, idade, sexo)
✅ Simulador de mutações com probabilidades
✅ Controle de anilhas, ovos e filhotes
✅ Financeiro (receitas x despesas)
✅ Tudo na nuvem — acessa do celular

Use meu cupom *${codigo}* e ganhe ${desc}% OFF na 1ª assinatura:
🔗 ${link}

#criadordeaves #canaricultura #plumar #ornitofilia`,
    share: null,
  },
  {
    titulo: '📢 Facebook / Grupos',
    icone: '📢',
    cor: '#1877F2',
    texto: (link, codigo, desc) =>
`Galera do criatório, encontrei um sistema que resolveu minha vida: PLUMAR.

Nunca mais perdi linhagem ou tive dor de cabeça com anilhas. E o simulador genético é surreal — você vê as probabilidades antes de formar o casal.

Quem quiser testar, tem 30 dias grátis. Com meu cupom ${codigo} ainda ganha ${desc}% OFF:
${link}

Vale conferir!`,
    share: (link, texto) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(texto)}`,
  },
  {
    titulo: '🐦 X / Twitter',
    icone: '🐦',
    cor: '#000',
    texto: (link, codigo, desc) =>
`Criadores de aves: parei de usar planilha e agora uso o @plumar_app. Simulador genético + controle completo do criatório.

Cupom ${codigo} dá ${desc}% OFF: ${link}`,
    share: (link, texto) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}`,
  },
  {
    titulo: '📝 E-mail / Biografia',
    icone: '📝',
    cor: '#C95025',
    texto: (link, codigo, desc) =>
`PLUMAR — Sistema completo de gestão para criatórios.
Plantel, genética, anilhas, financeiro e muito mais.

Use o cupom ${codigo} e ganhe ${desc}% OFF na 1ª assinatura.
${link}`,
    share: null,
  },
]

export function KitDivulgacao({ cupom }) {
  const [copied, setCopied] = useState('')

  const link = `https://plumar.com.br/?cupom=${cupom.codigo}`
  const desc = cupom.descontoPercentual || 15

  const copy = async (texto, id) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopied(id)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = texto
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(id)
      setTimeout(() => setCopied(''), 2000)
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        🎨 Kit de divulgação — textos prontos para compartilhar
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {TEMPLATES.map((t) => {
          const texto = t.texto(link, cupom.codigo, desc)
          const id = `${cupom.id}-${t.titulo}`
          return (
            <div
              key={t.titulo}
              style={{
                padding: 14,
                background: 'var(--bg-panel-solid, #fff)',
                border: '1px solid var(--line-soft)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: t.cor }}>
                  {t.titulo}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {t.share && (
                    <a
                      href={t.share(link, texto)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: t.cor, color: '#fff', border: 'none',
                        padding: '6px 12px', borderRadius: 6, fontSize: 11,
                        cursor: 'pointer', fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      Compartilhar →
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copy(texto, id)}
                    style={{
                      background: 'transparent', color: 'var(--text)',
                      border: '1px solid var(--line-soft)', padding: '6px 12px',
                      borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    {copied === id ? '✓ Copiado' : '📋 Copiar'}
                  </button>
                </div>
              </div>
              <div style={{
                background: 'var(--bg)', borderRadius: 6, padding: 10,
                fontSize: 12, lineHeight: 1.6, color: 'var(--text-muted)',
                whiteSpace: 'pre-line', maxHeight: 150, overflow: 'auto',
              }}>
                {texto}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 14, padding: 12, background: 'var(--accent-ghost, rgba(201,80,37,0.08))', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        <strong>💡 Dicas de ouro:</strong>
        <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
          <li>Poste fotos/vídeos do seu próprio plantel mostrando o sistema em uso</li>
          <li>Use stories diários — 1 postagem por semana não funciona</li>
          <li>Responda dúvidas nos comentários para criar engajamento</li>
          <li>Marque criadores conhecidos para viralizar</li>
          <li>Publique em grupos do Facebook/WhatsApp de criadores regionais</li>
        </ul>
      </div>
    </div>
  )
}
