import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LoginPage }        from './components/auth/LoginPage'
import { Sidebar }          from './components/layout/Sidebar'
import { Topbar }           from './components/layout/Topbar'
import { MobileDock }       from './components/layout/MobileDock'
import { PlantelModule }     from './components/modules/plantel/PlantelModule'
import { ChocandoModule }   from './components/modules/chocando/ChocandoModule'
import { GaiolasModule }    from './components/modules/gaiolas/GaiolasModule'
import { FilhotesModule }   from './components/modules/filhotes/FilhotesModule'
import { EspeciesModule }   from './components/modules/especies/EspeciesModule'
import { AviarioModule }    from './components/modules/aviario/AviarioModule'
import { AneisModule }      from './components/modules/aneis/AneisModule'
import { FinanceiroModule } from './components/modules/financeiro/FinanceiroModule'
import { ExPlantelModule }  from './components/modules/explantel/ExPlantelModule'
import { MutacoesModule }   from './components/modules/mutacoes/MutacoesModule'
import { AssinaturaModule } from './components/modules/assinatura/AssinaturaModule'
import { ProprietarioModule } from './components/modules/proprietario/ProprietarioModule'
import { ConfiguracoesModule } from './components/modules/configuracoes/ConfiguracoesModule'
import { AjudaModule }        from './components/modules/ajuda/AjudaModule'
import { BRAND } from './brand'

const PAGE_META = {
  plantel: {
    title: 'Gestão do Plantel',
    description: 'Acompanhe as aves ativas, atualize fichas com rapidez e mantenha o núcleo produtivo do criatório sempre organizado.',
  },
  chocando: {
    title: 'Aves em Choco',
    description: 'Monitore casais, posturas e andamento dos ciclos reprodutivos com uma leitura rápida da operação.',
  },
  gaiolas: {
    title: 'Gestão das Gaiolas',
    description: 'Visualize ocupação, preparo e distribuição das aves por ambiente para evitar gargalos no manejo.',
  },
  filhotes: {
    title: 'Filhotes Nascidos',
    description: 'Consolide nascimentos, evolução e movimentações dos filhotes até a entrada definitiva no plantel.',
  },
  especies: {
    title: 'Espécies do Criatório',
    description: 'Mantenha o cadastro taxonômico limpo e facilite o relacionamento das demais telas com cada espécie.',
  },
  aviario: {
    title: 'Cadastro de Criatórios',
    description: 'Cadastre criatórios, responsáveis e dados regulatórios em um único lugar para manter a operação organizada.',
  },
  aneis: {
    title: 'Controle de Anéis',
    description: 'Acompanhe disponibilidade e uso dos anéis para reduzir erros de identificação e rastreio.',
  },
  financeiro: {
    title: 'Gestão Financeira',
    description: 'Centralize entradas, saídas e indicadores financeiros ligados ao criatório em um só ambiente.',
  },
  explantel: {
    title: 'Ex-Aves do Plantel',
    description: 'Registre saídas do plantel com contexto e mantenha histórico confiável para consulta futura.',
  },
  mutacoes: {
    title: 'Simulação de Mutações',
    description: 'Explore cruzamentos e cenários genéticos com uma visualização mais agradável e orientada à análise.',
  },
  assinatura: {
    title: 'Minha Assinatura',
    description: 'Acompanhe trial, pagamento e período de acesso liberado para continuar usando o sistema.',
  },
  proprietario: {
    title: 'Controle do Proprietário',
    description: 'Gerencie assinaturas, pagamentos, testes grátis e liberação de acesso dos usuários.',
  },
  configuracoes: {
    title: 'Configurações Visuais',
    description: 'Personalize as cores-base do sistema e ajuste a identidade da interface ao estilo do seu criatório.',
  },
  ajuda: {
    title: 'Central de Ajuda',
    description: 'Manual completo do sistema com guia de todos os módulos, cadastros e funcionalidades.',
  },
}

function Dashboard() {
  const { user } = useAuth()
  const hasOperationalAccess = user?.access?.accessGranted || user?.role === 'owner'
  const isOwner = user?.role === 'owner'
  const defaultPage = hasOperationalAccess ? 'plantel' : 'assinatura'
  const [page, setPage] = useState(defaultPage)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const availablePages = hasOperationalAccess
    ? ['plantel', 'chocando', 'gaiolas', 'filhotes', 'especies', 'aviario', 'aneis', 'financeiro', 'explantel', 'assinatura', 'ajuda', 'configuracoes']
    : ['assinatura', 'ajuda', 'configuracoes']

  if (isOwner) {
    availablePages.push('mutacoes')
    availablePages.push('proprietario')
  }

  const resolvedPage = availablePages.includes(page) ? page : defaultPage

  const navigateTo = (nextPage) => {
    const targetPage = availablePages.includes(nextPage) ? nextPage : defaultPage
    setPage(targetPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!availablePages.includes(page)) {
      setPage(defaultPage)
    }
  }, [availablePages, defaultPage, page])

  // Auto-navegar para assinatura quando retorna do MercadoPago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') || params.get('external_reference')) {
      setPage('assinatura')
    }
  }, [])

  const meta = PAGE_META[resolvedPage] || { title: resolvedPage, description: '' }

  useEffect(() => {
    document.title = `${meta.title} • ${BRAND.name}`
  }, [meta.title])

  useEffect(() => {
    setSidebarOpen(false)
  }, [resolvedPage])

  return (
    <div className="app-shell">
      <div className="app-shell__ambient" />
      <button
        type="button"
        aria-label="Fechar navegação"
        className={`app-sidebar__backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar activePage={resolvedPage} onNavigate={navigateTo} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar
          page={resolvedPage}
          title={meta.title}
          description={meta.description}
          onOpenMenu={() => setSidebarOpen(true)}
        />
        <div className="app-content">
          {resolvedPage === 'plantel'    && <PlantelModule />}
          {resolvedPage === 'chocando'   && <ChocandoModule onNavigate={navigateTo} />}
          {resolvedPage === 'gaiolas'    && <GaiolasModule />}
          {resolvedPage === 'filhotes'   && <FilhotesModule />}
          {resolvedPage === 'especies'   && <EspeciesModule />}
          {resolvedPage === 'aviario'    && <AviarioModule />}
          {resolvedPage === 'aneis'      && <AneisModule />}
          {resolvedPage === 'financeiro' && <FinanceiroModule />}
          {resolvedPage === 'explantel'  && <ExPlantelModule />}
          {resolvedPage === 'mutacoes'   && <MutacoesModule />}
          {resolvedPage === 'assinatura' && <AssinaturaModule />}
          {resolvedPage === 'proprietario' && <ProprietarioModule />}
          {resolvedPage === 'ajuda'          && <AjudaModule />}
          {resolvedPage === 'configuracoes' && <ConfiguracoesModule />}
        </div>
        <MobileDock activePage={resolvedPage} onNavigate={navigateTo} onOpenMenu={() => setSidebarOpen(true)} />
      </div>
    </div>
  )
}

function AppRouter() {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      document.title = `${BRAND.name} • ${BRAND.descriptor}`
    }
  }, [isAuthenticated])

  if (loading) return (
    <div className="login-screen">
      <div className="login-ambient" />
      <div className="login-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        Carregando sistema...
      </div>
    </div>
  )

  return isAuthenticated ? <Dashboard /> : <LoginPage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}
