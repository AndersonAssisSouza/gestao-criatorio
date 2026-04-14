import { useEffect, useState } from 'react'
import { BRAND } from '../../../brand'
import { useTheme } from '../../../context/ThemeContext'

const THEME_FIELDS = [
  {
    key: 'accent',
    label: 'Cor principal',
    description: 'Usada em botões, destaques, indicadores e identidade geral.',
  },
  {
    key: 'accentStrong',
    label: 'Gradiente da marca',
    description: 'Tonalidade de apoio para profundidade do botão e da assinatura visual.',
  },
  {
    key: 'support',
    label: 'Cor de apoio',
    description: 'Controla brilhos secundários e o tom complementar da interface.',
  },
  {
    key: 'bgApp',
    label: 'Fundo principal',
    description: 'Base da aplicação inteira, inclusive login e área externa.',
  },
  {
    key: 'bgDeep',
    label: 'Fundo profundo',
    description: 'Usado nas sombras atmosféricas e camadas de profundidade.',
  },
  {
    key: 'bgPanel',
    label: 'Painéis e cards',
    description: 'Controla blocos internos, sidebar e superfícies da área autenticada.',
  },
]

export function ConfiguracoesModule() {
  const { theme, updateThemeColor, resetTheme } = useTheme()
  const [drafts, setDrafts] = useState(theme)

  useEffect(() => {
    setDrafts(theme)
  }, [theme])

  const commitHex = (key) => {
    const value = drafts[key]?.trim()

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || '')) {
      updateThemeColor(key, value)
      return
    }

    setDrafts((current) => ({ ...current, [key]: theme[key] }))
  }

  return (
    <div className="page-block">
      <section className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Estúdio visual</div>
          <h2 className="module-hero__title">Configurações de cores</h2>
          <div className="module-hero__text">
            Ajuste a identidade do {BRAND.shortName} em tempo real. As mudanças são salvas automaticamente no navegador e afetam login, navegação e os principais painéis do sistema.
          </div>
        </div>
        <div className="theme-studio__hero-aside">
          <span className="pill">Salvamento automático</span>
          <span className="pill pill--accent">Tema ativo</span>
        </div>
      </section>

      <div className="theme-studio">
        <section className="module-panel theme-studio__panel">
          <div className="theme-studio__panel-head">
            <div>
              <div className="theme-studio__kicker">Paleta principal</div>
              <h3 className="theme-studio__title">Escolha as cores base</h3>
            </div>
            <button type="button" className="theme-action-btn theme-action-btn--ghost" onClick={resetTheme}>
              Restaurar padrão
            </button>
          </div>

          <div className="theme-studio__controls">
            {THEME_FIELDS.map((field) => (
              <label key={field.key} className="theme-control">
                <div className="theme-control__head">
                  <div>
                    <div className="theme-control__label">{field.label}</div>
                    <div className="theme-control__text">{field.description}</div>
                  </div>
                  <span className="theme-control__swatch" style={{ background: theme[field.key] }} />
                </div>

                <div className="theme-control__inputs">
                  <input
                    type="color"
                    value={theme[field.key]}
                    onChange={(event) => {
                      updateThemeColor(field.key, event.target.value)
                      setDrafts((current) => ({ ...current, [field.key]: event.target.value }))
                    }}
                    className="theme-control__picker"
                  />
                  <input
                    type="text"
                    value={drafts[field.key]}
                    onChange={(event) => setDrafts((current) => ({ ...current, [field.key]: event.target.value }))}
                    onBlur={() => commitHex(field.key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur()
                      }
                    }}
                    className="theme-control__hex"
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="module-panel theme-studio__panel">
          <div className="theme-studio__panel-head">
            <div>
              <div className="theme-studio__kicker">Prévia</div>
              <h3 className="theme-studio__title">Como o sistema reage</h3>
            </div>
          </div>

          <div className="theme-preview">
            <div className="theme-preview__shell">
              <div className="theme-preview__top">
                <div>
                  <div className="theme-preview__eyebrow">Marca aplicada</div>
                  <div className="theme-preview__brand">{BRAND.name}</div>
                </div>
                <span className="pill pill--accent">Visual ao vivo</span>
              </div>

              <div className="theme-preview__grid">
                <article className="theme-preview__card theme-preview__card--accent">
                  <div className="theme-preview__label">Botões e CTAs</div>
                  <div className="theme-preview__value">Cor principal</div>
                  <div className="theme-preview__text">Ação de cadastro, navegação ativa e estados de destaque.</div>
                </article>

                <article className="theme-preview__card">
                  <div className="theme-preview__label">Painéis</div>
                  <div className="theme-preview__value">Base estrutural</div>
                  <div className="theme-preview__text">Sidebar, cards e módulos internos usam essa camada para consistência visual.</div>
                </article>

                <article className="theme-preview__card theme-preview__card--support">
                  <div className="theme-preview__label">Cor de apoio</div>
                  <div className="theme-preview__value">Atmosfera</div>
                  <div className="theme-preview__text">Brilhos secundários e a sensação premium do sistema vêm daqui.</div>
                </article>
              </div>

              <div className="theme-preview__footer">
                <button type="button" className="theme-action-btn">
                  Identidade visual ativa
                </button>
                <div className="theme-preview__note">
                  Dica: uma combinação boa mantém contraste forte entre fundo escuro e cor principal.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
