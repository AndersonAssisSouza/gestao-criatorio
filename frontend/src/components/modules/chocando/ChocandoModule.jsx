import { useState, useEffect, useMemo } from 'react'
import { StatCard }    from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { accessService } from '../../../services/access.service'
import { ovosService } from '../../../services/ovos.service'

const USE_MOCK = !import.meta.env.VITE_API_URL

// ─── MOCK DATA — remover quando backend estiver conectado ───────────────────
const MOCK_GAIOLAS_CHOCANDO = [
  { ID: 1, NumeroGaiola: '001', Status: 'Chocando' },
]

const MOCK_PLANTEL = [
  { ID: 4, Nome: 'Manchinha', Genero: 'Fêmea', Status: 'Vivo', CategoriaAve: 'Tarim', Mutacao: 'Canela Pastel', Gaiola: '001' },
  { ID: 9, Nome: 'Pardinho',  Genero: 'Macho', Status: 'Vivo', CategoriaAve: 'Tarim', Mutacao: 'Duplo Diluído', Gaiola: '001' },
  { ID: 8, Nome: 'Hulk',      Genero: 'Macho', Status: 'Vivo', CategoriaAve: 'Tarim', Mutacao: 'Canela',        Gaiola: '002' },
  { ID: 10, Nome: 'Bandite',  Genero: 'Macho', Status: 'Vivo', CategoriaAve: 'canário belga', Mutacao: '',       Gaiola: '003' },
  { ID: 11, Nome: 'Pardinha', Genero: 'Femea', Status: 'Vivo', CategoriaAve: 'Tarim', Mutacao: 'Canela Pastel', Gaiola: '003' },
]

const MOCK_OVOS = [
  { ID: 1776113513899, NumeroOvo: '1', Gaiola: '001', Status: 'Fertilizado', DataPostura: '2026-04-13', DataInicioChoco: '2026-04-01', ConfirmaInicioChoco: 'Sim', DataPrevistaNascimento: '2026-04-15', DataNascimento: '', DataConfirmacaoFetilizacao: '2026-04-13', DataDescarte: '', NomeMae: 'Manchinha', NomePai: 'Pardinho', NinhadaId: '0f5b6011-fa57-4e94-a9c1-b8d8b49115d4', NinhadaNumero: 4 },
]

// TempoChoco por especie (dias) — lookup simplificado
const TEMPO_CHOCO = { Tarim: 13, 'canário belga': 13 }

function mapPlantelRecord(record) {
  return {
    ID: record.id,
    Nome: record.nome,
    Genero: record.genero,
    Status: record.status,
    CategoriaAve: record.categoriaAve,
    Mutacao: record.mutacao,
    Gaiola: record.gaiola,
  }
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function isAliveBird(record = {}) {
  return normalizeText(record.Status) === 'vivo'
}

function matchesGender(record = {}, expected) {
  return normalizeText(record.Genero) === normalizeText(expected)
}

// ─── Helper: format date ────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '---'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('pt-BR')
}

const todayISO = () => new Date().toISOString().split('T')[0]

function sortClutches(items = []) {
  return items.slice().sort((left, right) => Number(right.Numero || 0) - Number(left.Numero || 0))
}

// ─── Egg status colors for the circle ───────────────────────────────────────
const EGG_COLORS = {
  Postura:     { bg: 'rgba(91,192,235,0.15)',  border: '#5BC0EB', text: '#5BC0EB' },
  Chocando:    { bg: 'rgba(245,166,35,0.15)',  border: '#F5A623', text: '#F5A623' },
  Fertilizado: { bg: 'rgba(76,175,125,0.15)',  border: '#4CAF7D', text: '#4CAF7D' },
  Nasceu:      { bg: 'rgba(76,175,125,0.25)',  border: '#4CAF7D', text: '#4CAF7D' },
  Descartado:  { bg: 'rgba(224,92,75,0.15)',   border: '#E05C4B', text: '#E05C4B' },
}

// ─── Egg Popup Component (ctxGestaoOvoPopUp) ────────────────────────────────
function EggPopup({ egg, onSave, onDiscard, onClose }) {
  const [actionDate, setActionDate] = useState(todayISO())

  const getNextAction = () => {
    switch (egg.Status) {
      case 'Postura':     return { label: 'Iniciar Choco', nextStatus: 'Chocando' }
      case 'Chocando':    return { label: 'Confirmar Fertilizado', nextStatus: 'Fertilizado' }
      case 'Fertilizado': return { label: 'Registrar Nascimento', nextStatus: 'Nasceu' }
      default:            return null
    }
  }

  const action = getNextAction()

  return (
    <div className="p-overlay" onClick={onClose}>
      <div className="p-popup" onClick={e => e.stopPropagation()}>
        <div className="p-panel-header__title mb-2">Ovo #{egg.NumeroOvo}</div>

        {/* Egg Info */}
        <div className="p-form-grid">
          <div className="p-field">
            <div className="p-label">Status</div>
            <StatusBadge status={egg.Status} />
          </div>
          <div className="p-field">
            <div className="p-label">Data Postura</div>
            <div className="text-main">{fmtDate(egg.DataPostura)}</div>
          </div>
        </div>

        <div className="p-form-grid">
          <div className="p-field">
            <div className="p-label">Data Inicio Choco</div>
            <div className="text-main">{fmtDate(egg.DataInicioChoco)}</div>
          </div>
          <div className="p-field">
            <div className="p-label">Previsao Nascimento</div>
            <div className="text-main">{fmtDate(egg.DataPrevistaNascimento)}</div>
          </div>
        </div>

        {egg.DataConfirmacaoFetilizacao && (
          <div className="p-form-grid">
            <div className="p-field">
              <div className="p-label">Confirmacao Fertilizacao</div>
              <div className="text-main">{fmtDate(egg.DataConfirmacaoFetilizacao)}</div>
            </div>
            <div className="p-field" />
          </div>
        )}

        <hr className="p-divider" />

        {/* Action Section */}
        {action && !['Nasceu', 'Descartado'].includes(egg.Status) && (
          <>
            <div className="p-field mb-2">
              <div className="p-label">Data da Acao</div>
              <input
                type="date"
                value={actionDate}
                onChange={e => setActionDate(e.target.value)}
                className="p-input"
              />
            </div>

            <div className="flex gap-2 mb-2">
              <button
                className="p-btn p-btn--primary"
                onClick={() => onSave(egg, action.nextStatus, actionDate)}
              >
                {action.label}
              </button>
              <button
                className="p-btn p-btn--danger"
                onClick={() => onDiscard(egg, actionDate)}
              >
                Descartar
              </button>
            </div>
          </>
        )}

        {['Nasceu', 'Descartado'].includes(egg.Status) && (
          <div className="text-muted" style={{ padding: '8px 0', fontSize: 12 }}>
            Este ovo ja foi finalizado ({egg.Status}).
          </div>
        )}

        <button className="p-btn p-btn--secondary" onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}

// ─── Parent Detail Card ─────────────────────────────────────────────────────
function ParentCard({ bird, role }) {
  if (!bird) return (
    <div className="p-list-item" style={{ opacity: 0.4, cursor: 'default' }}>
      <div className="p-label">{role}</div>
      <div className="text-muted">{'\u00A0'}Nenhuma ave selecionada</div>
    </div>
  )
  return (
    <div className="p-list-item" style={{ cursor: 'default', borderLeft: `3px solid ${role === 'Femea' ? '#E88DB4' : '#5BC0EB'}` }}>
      <div className="p-label">{role}</div>
      <div className="font-serif" style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{bird.Nome}</div>
      <div className="p-form-grid">
        <div className="p-field">
          <div className="p-label">Especie</div>
          <div className="text-main">{bird.CategoriaAve}</div>
        </div>
        <div className="p-field">
          <div className="p-label">Mutacao</div>
          <div className="text-main">{bird.Mutacao}</div>
        </div>
      </div>
      <div className="p-form-grid">
        <div className="p-field">
          <div className="p-label">Genero</div>
          <div className="text-main">{bird.Genero}</div>
        </div>
        <div className="p-field">
          <div className="p-label">Status</div>
          <StatusBadge status={bird.Status} />
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MODULE
// ═════════════════════════════════════════════════════════════════════════════
export function ChocandoModule() {
  const [gaiolas, setGaiolas]         = useState([])
  const [plantel, setPlantel]         = useState([])
  const [ovos, setOvos]               = useState([])
  const [ninhadas, setNinhadas]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedGaiola, setSelectedGaiola] = useState(null)
  const [selectedNinhadaId, setSelectedNinhadaId] = useState('')
  const [selectedFemea, setSelectedFemea]   = useState('')
  const [selectedMacho, setSelectedMacho]   = useState('')
  const [eggPopup, setEggPopup]       = useState(null)   // egg object or null

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK) {
      setTimeout(() => {
        setGaiolas(MOCK_GAIOLAS_CHOCANDO)
        setPlantel(MOCK_PLANTEL)
        setOvos(MOCK_OVOS)
        setLoading(false)
      }, 400)
      return
    }

    Promise.all([
      accessService.getImportedSharePointData(),
      ovosService.listar(),
    ])
      .then(([snapshot, ovosResponse]) => {
        setGaiolas((snapshot.gaiolas || []).filter((gaiola) => gaiola.Status === 'Chocando'))
        setPlantel((snapshot.plantel || []).map(mapPlantelRecord))
        setOvos(ovosResponse.items || [])
        setNinhadas(ovosResponse.ninhadas || [])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // ─── Select first cage on load ────────────────────────────────────────────
  useEffect(() => {
    if (gaiolas.length > 0 && !selectedGaiola) {
      setSelectedGaiola(gaiolas[0])
    }
  }, [gaiolas, selectedGaiola])

  // ─── Auto-select parents when cage changes ────────────────────────────────
  useEffect(() => {
    if (!selectedGaiola) { setSelectedFemea(''); setSelectedMacho(''); return }
    const cage = selectedGaiola.NumeroGaiola
    const femea = plantel.find(p => p.Gaiola === cage && matchesGender(p, 'Fêmea') && isAliveBird(p))
    const macho = plantel.find(p => p.Gaiola === cage && matchesGender(p, 'Macho') && isAliveBird(p))
    setSelectedFemea(femea ? String(femea.ID) : '')
    setSelectedMacho(macho ? String(macho.ID) : '')
  }, [selectedGaiola, plantel])

  useEffect(() => {
    if (!selectedGaiola) {
      setSelectedNinhadaId('')
      return
    }

    const cageClutches = sortClutches(
      ninhadas.filter((item) => item.Gaiola === selectedGaiola.NumeroGaiola),
    )
    const activeClutch = cageClutches.find((item) => item.Status === 'Ativa')
    setSelectedNinhadaId(activeClutch?.id || cageClutches[0]?.id || '')
  }, [selectedGaiola, ninhadas])

  // ─── Derived data ─────────────────────────────────────────────────────────
  const femeas = useMemo(() => plantel.filter(p => matchesGender(p, 'Fêmea') && isAliveBird(p)), [plantel])
  const machos = useMemo(() => plantel.filter(p => matchesGender(p, 'Macho') && isAliveBird(p)), [plantel])
  const selectedFemeaObj = plantel.find(p => String(p.ID) === selectedFemea) || null
  const selectedMachoObj = plantel.find(p => String(p.ID) === selectedMacho) || null

  const cageClutches = useMemo(() => {
    if (!selectedGaiola) return []
    return sortClutches(ninhadas.filter((item) => item.Gaiola === selectedGaiola.NumeroGaiola))
  }, [ninhadas, selectedGaiola])

  const selectedNinhada = useMemo(
    () => cageClutches.find((item) => item.id === selectedNinhadaId) || null,
    [cageClutches, selectedNinhadaId],
  )

  const cageEggs = useMemo(() => {
    if (!selectedGaiola) return []
    if (!selectedNinhadaId) return ovos.filter(o => o.Gaiola === selectedGaiola.NumeroGaiola)
    return ovos.filter((item) => item.Gaiola === selectedGaiola.NumeroGaiola && item.NinhadaId === selectedNinhadaId)
  }, [ovos, selectedGaiola, selectedNinhadaId])

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    gaiolas:     gaiolas.length,
    totalOvos:   ovos.length,
    chocando:    ovos.filter(o => o.Status === 'Chocando').length,
    fertilizados:ovos.filter(o => o.Status === 'Fertilizado').length,
  }

  // ─── Egg Lifecycle Logic (Power Apps Patch) ───────────────────────────────
  const handleEggAction = (egg, nextStatus, actionDate) => {
    const payload = {
      Status: nextStatus,
      ActionDate: actionDate,
    }

    if (nextStatus === 'Chocando') {
      const especie = selectedFemeaObj?.CategoriaAve || 'Tarin'
      const tempoChoco = TEMPO_CHOCO[especie] || 14
      const startDate = new Date(`${actionDate}T00:00:00`)
      startDate.setDate(startDate.getDate() + tempoChoco)
      payload.DataPrevistaNascimento = startDate.toISOString().split('T')[0]
    }

    ovosService.atualizarStatus(egg.ID, payload)
      .then((response) => {
        setOvos(response.items || [])
        setNinhadas(response.ninhadas || [])
        setEggPopup(null)
      })
  }

  const handleEggDiscard = (egg, actionDate) => {
    ovosService.atualizarStatus(egg.ID, { Status: 'Descartado', ActionDate: actionDate })
      .then((response) => {
        setOvos(response.items || [])
        setNinhadas(response.ninhadas || [])
        setEggPopup(null)
      })
  }

  // ─── Add new egg ──────────────────────────────────────────────────────────
  const handleAddEgg = () => {
    if (!selectedGaiola) return
    ovosService.criar({
      Gaiola: selectedGaiola.NumeroGaiola,
      NomeMae: selectedFemeaObj?.Nome || '',
      NomePai: selectedMachoObj?.Nome || '',
      DataPostura: todayISO(),
    })
      .then((response) => {
        setOvos(response.items || [])
        setNinhadas(response.ninhadas || [])
        if (selectedNinhadaId !== response.item?.NinhadaId) {
          setSelectedNinhadaId(response.item?.NinhadaId || '')
        }
      })
  }

  const handleRestartClutch = () => {
    if (!selectedGaiola) return

    ovosService.reiniciarNinhada({
      Gaiola: selectedGaiola.NumeroGaiola,
      NomeMae: selectedFemeaObj?.Nome || '',
      NomePai: selectedMachoObj?.Nome || '',
    })
      .then((response) => {
        setNinhadas(response.ninhadas || [])
        setOvos(response.items || [])
        setSelectedNinhadaId(response.ninhada?.id || '')
      })
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center text-muted" style={{ height: '50vh', fontSize: 13 }}>
      Carregando dados de choco...
    </div>
  )

  return (
    <div>
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Reprodução</div>
          <h2 className="module-hero__title">Acompanhamento de choco</h2>
          <div className="module-hero__text">
            Visualize gaiolas em choco, confira o casal reprodutor e acompanhe o ciclo de cada ovo com uma leitura mais clara do processo.
          </div>
        </div>
        <div className="pill pill--accent">Ciclo ativo</div>
      </div>

      {/* Stats Row */}
      <div className="p-stats mb-3">
        <StatCard label="Gaiolas Chocando" value={stats.gaiolas}      desc="gaiolas ativas"       color="#F5A623" />
        <StatCard label="Total Ovos"       value={stats.totalOvos}    desc="ovos registrados"     color="#5BC0EB" />
        <StatCard label="Em Choco"         value={stats.chocando}     desc="ovos em choco"        color="#C95025" />
        <StatCard label="Fertilizados"     value={stats.fertilizados} desc="ovos confirmados"     color="#4CAF7D" />
      </div>

      {/* 3-Panel Layout */}
      <div className="p-split p-split--choco">

        {/* ─── LEFT PANEL: Cage Gallery ──────────────────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Gaiolas</div>
              <div className="p-panel-header__subtitle">{gaiolas.length} chocando</div>
            </div>
          </div>
          <div className="p-panel-body">
            {gaiolas.map(g => (
              <div
                key={g.ID}
                className={`p-list-item${selectedGaiola?.ID === g.ID ? ' is-active' : ''}`}
                onClick={() => setSelectedGaiola(g)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-serif" style={{ fontSize: 16, fontWeight: 700 }}>
                    {g.NumeroGaiola}
                  </div>
                  <StatusBadge status={g.Status} />
                </div>
              </div>
            ))}
            {gaiolas.length === 0 && (
              <div className="module-empty">
                Nenhuma gaiola chocando
              </div>
            )}
          </div>
        </div>

        {/* ─── MIDDLE PANEL: Parent Selection ────────────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Casal Reprodutor</div>
              <div className="p-panel-header__subtitle">
                {selectedGaiola ? selectedGaiola.NumeroGaiola : 'Selecione uma gaiola'}
              </div>
            </div>
          </div>
          <div className="p-panel-body">
            {selectedGaiola ? (
              <>
                {/* Female ComboBox */}
                <div className="p-field mb-2">
                  <div className="p-label">Femea</div>
                  <select
                    className="p-select"
                    value={selectedFemea}
                    onChange={e => setSelectedFemea(e.target.value)}
                  >
                    <option value="">-- Selecione a femea --</option>
                    {femeas.map(f => (
                      <option key={f.ID} value={String(f.ID)}>
                        {f.Nome} — {f.Mutacao}
                      </option>
                    ))}
                  </select>
                </div>
                <ParentCard bird={selectedFemeaObj} role="Femea" />

                <hr className="p-divider" />

                {/* Male ComboBox */}
                <div className="p-field mb-2">
                  <div className="p-label">Macho</div>
                  <select
                    className="p-select"
                    value={selectedMacho}
                    onChange={e => setSelectedMacho(e.target.value)}
                  >
                    <option value="">-- Selecione o macho --</option>
                    {machos.map(m => (
                      <option key={m.ID} value={String(m.ID)}>
                        {m.Nome} — {m.Mutacao}
                      </option>
                    ))}
                  </select>
                </div>
                <ParentCard bird={selectedMachoObj} role="Macho" />

                <hr className="p-divider" />

                {/* Mutation Simulator Note */}
                <button
                  className="p-btn p-btn--secondary w-full"
                  style={{ justifyContent: 'center' }}
                  onClick={() => alert('Navegar para Simulacao de Mutacao dos Filhotes (tela a integrar)')}
                >
                  Simulacao Mutacao dos Filhotes
                </button>
                <div className="text-muted mt-1" style={{ fontSize: 10, textAlign: 'center' }}>
                  Abre o simulador de previsao genetica
                </div>
              </>
            ) : (
              <div className="module-empty">
                Selecione uma gaiola para ver o casal
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Eggs Gallery ─────────────────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Ovos</div>
              <div className="p-panel-header__subtitle">
                {selectedGaiola
                  ? `${cageEggs.length} ovo(s) — ${selectedGaiola.NumeroGaiola}${selectedNinhada ? ` · ninhada ${selectedNinhada.Numero}` : ''}`
                  : 'Selecione uma gaiola'}
              </div>
            </div>
            {selectedGaiola && (
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                <button className="p-btn p-btn--secondary" onClick={handleRestartClutch}>
                  Reiniciar nova ninhada
                </button>
                <button className="p-btn p-btn--primary" onClick={handleAddEgg}>
                  + Adicionar Ovo
                </button>
              </div>
            )}
          </div>
          <div className="p-panel-body">
            {!selectedGaiola ? (
              <div className="module-empty">
                Selecione uma gaiola para ver os ovos
              </div>
            ) : cageEggs.length === 0 ? (
              <>
                {cageClutches.length > 0 ? (
                  <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
                    {cageClutches.map((item) => (
                      <button
                        key={item.id}
                        className={`pill${selectedNinhadaId === item.id ? ' pill--accent' : ''}`}
                        onClick={() => setSelectedNinhadaId(item.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        Ninhada {item.Numero} · {item.Status}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="module-empty">
                  <div style={{ fontSize: 36, marginBottom: 8 }}>&#x1F95A;</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {selectedNinhada
                      ? 'Nenhum ovo registrado nesta ninhada.'
                      : 'Nenhum ovo registrado nesta gaiola.'}
                  </div>
                </div>
              </>
            ) : (
              <>
                {cageClutches.length > 0 ? (
                  <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
                    {cageClutches.map((item) => (
                      <button
                        key={item.id}
                        className={`pill${selectedNinhadaId === item.id ? ' pill--accent' : ''}`}
                        onClick={() => setSelectedNinhadaId(item.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        Ninhada {item.Numero} · {item.Status}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Eggs as circles/cards */}
                <div className="flex items-center justify-center" style={{ flexWrap: 'wrap', gap: 14, marginBottom: 16, padding: '8px 0' }}>
                  {cageEggs.map(egg => {
                    const ec = EGG_COLORS[egg.Status] || EGG_COLORS.Postura
                    return (
                      <div
                        key={egg.ID}
                        className="p-egg-circle"
                        style={{
                          width: 52, height: 52, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s',
                          background: ec.bg,
                          border: `2px solid ${ec.border}`,
                          color: ec.text,
                        }}
                        title={`Ovo #${egg.NumeroOvo} — ${egg.Status}`}
                        onClick={() => setEggPopup(egg)}
                      >
                        #{egg.NumeroOvo}
                      </div>
                    )
                  })}
                </div>

                {/* Eggs detail list */}
                {cageEggs.map(egg => (
                  <div
                    key={egg.ID}
                    className="p-list-item"
                    onClick={() => setEggPopup(egg)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-serif" style={{ fontSize: 14, fontWeight: 700 }}>
                        Ovo #{egg.NumeroOvo}
                      </div>
                      <StatusBadge status={egg.Status} />
                    </div>
                    <div className="p-form-grid">
                      <div className="p-field">
                        <div className="p-label">Postura</div>
                        <div className="text-muted">{fmtDate(egg.DataPostura)}</div>
                      </div>
                      <div className="p-field">
                        <div className="p-label">Prev. Nascimento</div>
                        <div className="text-muted">{fmtDate(egg.DataPrevistaNascimento)}</div>
                      </div>
                    </div>
                    {egg.DataInicioChoco && (
                      <div className="p-form-grid">
                        <div className="p-field">
                          <div className="p-label">Inicio Choco</div>
                          <div className="text-muted">{fmtDate(egg.DataInicioChoco)}</div>
                        </div>
                        <div className="p-field">
                          <div className="p-label">Confirmacao</div>
                          <div className="text-muted">{egg.ConfirmaInicioChoco || '---'}</div>
                        </div>
                      </div>
                    )}
                    {egg.DataDescarte && (
                      <div className="p-field mt-1">
                        <div className="p-label">Descarte</div>
                        <div className="text-accent" style={{ color: '#E05C4B' }}>{fmtDate(egg.DataDescarte)}</div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Egg Popup Modal ───────────────────────────────────────────── */}
      {eggPopup && (
        <EggPopup
          egg={eggPopup}
          onSave={handleEggAction}
          onDiscard={handleEggDiscard}
          onClose={() => setEggPopup(null)}
        />
      )}
    </div>
  )
}
