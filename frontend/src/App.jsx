import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage }        from './components/auth/LoginPage'
import { Sidebar }          from './components/layout/Sidebar'
import { Topbar }           from './components/layout/Topbar'
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

const PAGE_TITLES = {
  plantel:    'Gestão do Plantel',
  chocando:   'Aves em Choco',
  gaiolas:    'Gestão das Gaiolas',
  filhotes:   'Filhotes Nascidos',
  especies:   'Espécies do Criatório',
  aviario:    'Gestão do Aviário',
  aneis:      'Controle de Anéis',
  financeiro: 'Gestão Financeira',
  explantel:  'Ex-Aves do Plantel',
  mutacoes:   'Simulação de Mutações',
}

function Dashboard() {
  const [page, setPage] = useState('plantel')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A1A0C', fontFamily: "'DM Serif Display', serif" }}>
      <Sidebar activePage={page} onNavigate={setPage} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar page={page} />
        <div style={{ flex: 1, padding: 28, overflowY: 'auto', background: '#0A1A0C' }}>
          {page === 'plantel'    && <PlantelModule />}
          {page === 'chocando'   && <ChocandoModule />}
          {page === 'gaiolas'    && <GaiolasModule />}
          {page === 'filhotes'   && <FilhotesModule />}
          {page === 'especies'   && <EspeciesModule />}
          {page === 'aviario'    && <AviarioModule />}
          {page === 'aneis'      && <AneisModule />}
          {page === 'financeiro' && <FinanceiroModule />}
          {page === 'explantel'  && <ExPlantelModule />}
          {page === 'mutacoes'   && <MutacoesModule />}
        </div>
      </div>
    </div>
  )
}

function AppRouter() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1A0C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando...
    </div>
  )

  return isAuthenticated ? <Dashboard /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
