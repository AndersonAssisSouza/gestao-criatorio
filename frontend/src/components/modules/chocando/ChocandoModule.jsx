import { useState, useEffect, useMemo } from 'react'
import { StatCard }    from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { accessService } from '../../../services/access.service'
import { ovosService } from '../../../services/ovos.service'

const USE_MOCK = !import.meta.env.VITE_API_URL

// ─── MOCK DATA — remover quando backend estiver conectado ───────────────────
const MOCK_GAIOLAS_CHOCANDO = [
  { ID: 1, NumeroGaiola: 'G-01', Status: 'Chocando' },
  { ID: 2, NumeroGaiola: 'G-02', Status: 'Chocando' },
]

const MOCK_PLANTEL = [
  { ID: 1, Nome: 'Thor',   Genero: 'Macho', Status: 'Vivo', CategoriaAve: 'Tarin', Mutacao: 'Ancestral',      Gaiola: 'G-01' },
  { ID: 2, Nome: 'Athena', Genero: 'Femea', Status: 'Vivo', CategoriaAve: 'Tarin', Mutacao: 'Canela',         Gaiola: 'G-01' },
  { ID: 3, Nome: 'Apollo', Genero: 'Macho', Status: 'Vivo', CategoriaAve: 'Tarin', Mutacao: 'Pastel',         Gaiola: 'G-02' },
  { ID: 4, Nome: 'Diana',  Genero: 'Femea', Status: 'Vivo', CategoriaAve: 'Tarin', Mutacao: 'Canela Pastel',  Gaiola: 'G-02' },
]

const MOCK_OVOS = [
  { ID: 1, NumeroOvo: '1', Gaiola: 'G-01', Status: 'Postura',     DataPostura: '2026-03-20', DataInicioChoco: '',           ConfirmaInicioChoco: '', DataPrevistaNascimento: '',           DataNascimento: '', DataConfirmacaoFetilizacao: '', DataDescarte: '' },
  { ID: 2, NumeroOvo: '2', Gaiola: 'G-01', Status: 'Chocando',    DataPostura: '2026-03-18', DataInicioChoco: '2026-03-20', ConfirmaInicioChoco: 'Sim', DataPrevistaNascimento: '2026-04-03', DataNascimento: '', DataConfirmacaoFetilizacao: '', DataDescarte: '' },
  { ID: 3, NumeroOvo: '3', Gaiola: 'G-01', Status: 'Fertilizado', DataPostura: '2026-03-15', DataInicioChoco: '2026-03-17', ConfirmaInicioChoco: 'Sim', DataPrevistaNascimento: '2026-03-31', DataNascimento: '', DataConfirmacaoFetilizacao: '2026-03-25', DataDescarte: '' },
  { ID: 4, NumeroOvo: '1', Gaiola: 'G-02', Status: 'Postura',     DataPostura: '2026-04-01', DataInicioChoco: '',           ConfirmaInicioChoco: '', DataPrevistaNascimento: '',           DataNascimento: '', DataConfirmacaoFetilizacao: '', DataDescarte: '' },
]

// TempoChoco por especie (dias) — lookup simplificado
const TEMPO_CHOCO = { Tarin: 14, Canario: 13, Pintassilgo: 14 }

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

// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  container:    { display: 'grid', gap: 16, minHeight: 'calc(100vh - 260px)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' },
  panel:        { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  panelHeader:  { padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle:   { fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" },
  panelSub:     { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' },
  panelBody:    { padding: '12px 16px', flex: 1, overflowY: 'auto' },
  card:         { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '16px 16px', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s' },
  cardSelected: { background: 'linear-gradient(135deg, rgba(201,80,37,0.12), rgba(255,255,255,0.04))', border: '1px solid rgba(201,80,37,0.3)' },
  label:        { fontSize: 10, color: 'var(--text-muted)', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 },
  value:        { fontSize: 13, color: 'var(--text-main)', fontFamily: 'inherit' },
  valueMuted:   { fontSize: 12, color: 'var(--text-soft)', fontFamily: 'inherit' },
  row:          { display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  col:          { flex: '1 1 140px', minWidth: 0 },
  btn:          { background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'var(--text-main)', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  btnSecondary: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', color: 'var(--text-main)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' },
  select:       { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', appearance: 'none' },
  input:        { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%' },
  overlay:      { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  popup:        { background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '28px 32px', width: 'min(420px, calc(100vw - 24px))', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' },
  popupTitle:   { fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 20 },
  divider:      { height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' },
  eggCircle:    { width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s', border: '2px solid transparent' },
  historyButton: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '8px 12px', color: 'var(--text-main)', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' },
  historyButtonActive: { background: 'rgba(201,80,37,0.16)', borderColor: 'rgba(201,80,37,0.3)' },
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
    <div style={S.overlay} onClick={onClose}>
      <div style={S.popup} onClick={e => e.stopPropagation()}>
        <div style={S.popupTitle}>Ovo #{egg.NumeroOvo}</div>

        {/* Egg Info */}
        <div style={S.row}>
          <div style={S.col}>
            <div style={S.label}>Status</div>
            <StatusBadge status={egg.Status} />
          </div>
          <div style={S.col}>
            <div style={S.label}>Data Postura</div>
            <div style={S.value}>{fmtDate(egg.DataPostura)}</div>
          </div>
        </div>

        <div style={S.row}>
          <div style={S.col}>
            <div style={S.label}>Data Inicio Choco</div>
            <div style={S.value}>{fmtDate(egg.DataInicioChoco)}</div>
          </div>
          <div style={S.col}>
            <div style={S.label}>Previsao Nascimento</div>
            <div style={S.value}>{fmtDate(egg.DataPrevistaNascimento)}</div>
          </div>
        </div>

        {egg.DataConfirmacaoFetilizacao && (
          <div style={S.row}>
            <div style={S.col}>
              <div style={S.label}>Confirmacao Fertilizacao</div>
              <div style={S.value}>{fmtDate(egg.DataConfirmacaoFetilizacao)}</div>
            </div>
            <div style={S.col} />
          </div>
        )}

        <div style={S.divider} />

        {/* Action Section */}
        {action && !['Nasceu', 'Descartado'].includes(egg.Status) && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Data da Acao</div>
              <input
                type="date"
                value={actionDate}
                onChange={e => setActionDate(e.target.value)}
                style={S.input}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button
                style={S.btn}
                onClick={() => onSave(egg, action.nextStatus, actionDate)}
              >
                {action.label}
              </button>
              <button
                style={{ ...S.btnSecondary, color: '#E05C4B', borderColor: 'rgba(224,92,75,0.3)' }}
                onClick={() => onDiscard(egg, actionDate)}
              >
                Descartar
              </button>
            </div>
          </>
        )}

        {['Nasceu', 'Descartado'].includes(egg.Status) && (
          <div style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'inherit', padding: '8px 0' }}>
            Este ovo ja foi finalizado ({egg.Status}).
          </div>
        )}

        <button style={S.btnSecondary} onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}

// ─── Parent Detail Card ─────────────────────────────────────────────────────
function ParentCard({ bird, role }) {
  if (!bird) return (
    <div style={{ ...S.card, opacity: 0.4, cursor: 'default' }}>
      <div style={S.label}>{role}</div>
      <div style={S.valueMuted}>Nenhuma ave selecionada</div>
    </div>
  )
  return (
    <div style={{ ...S.card, cursor: 'default', borderLeft: `3px solid ${role === 'Femea' ? '#E88DB4' : '#5BC0EB'}` }}>
      <div style={S.label}>{role}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>{bird.Nome}</div>
      <div style={S.row}>
        <div style={S.col}>
          <div style={S.label}>Especie</div>
          <div style={S.value}>{bird.CategoriaAve}</div>
        </div>
        <div style={S.col}>
          <div style={S.label}>Mutacao</div>
          <div style={S.value}>{bird.Mutacao}</div>
        </div>
      </div>
      <div style={S.row}>
        <div style={S.col}>
          <div style={S.label}>Genero</div>
          <div style={S.value}>{bird.Genero}</div>
        </div>
        <div style={S.col}>
          <div style={S.label}>Status</div>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Gaiolas Chocando" value={stats.gaiolas}      desc="gaiolas ativas"       color="#F5A623" />
        <StatCard label="Total Ovos"       value={stats.totalOvos}    desc="ovos registrados"     color="#5BC0EB" />
        <StatCard label="Em Choco"         value={stats.chocando}     desc="ovos em choco"        color="#C95025" />
        <StatCard label="Fertilizados"     value={stats.fertilizados} desc="ovos confirmados"     color="#4CAF7D" />
      </div>

      {/* 3-Panel Layout */}
      <div style={S.container}>

        {/* ─── LEFT PANEL: Cage Gallery ──────────────────────────────────── */}
        <div className="module-panel" style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelTitle}>Gaiolas</div>
              <div style={S.panelSub}>{gaiolas.length} chocando</div>
            </div>
          </div>
          <div style={S.panelBody}>
            {gaiolas.map(g => (
              <div
                key={g.ID}
                style={{
                  ...S.card,
                  ...(selectedGaiola?.ID === g.ID ? S.cardSelected : {}),
                }}
                onClick={() => setSelectedGaiola(g)}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 6 }}>
                  {g.NumeroGaiola}
                </div>
                <StatusBadge status={g.Status} />
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                  {ovos.filter(o => o.Gaiola === g.NumeroGaiola).length} ovo(s)
                </div>
              </div>
            ))}
            {gaiolas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit' }}>
                Nenhuma gaiola chocando
              </div>
            )}
          </div>
        </div>

        {/* ─── MIDDLE PANEL: Parent Selection ────────────────────────────── */}
        <div className="module-panel" style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelTitle}>Casal Reprodutor</div>
              <div style={S.panelSub}>
                {selectedGaiola ? selectedGaiola.NumeroGaiola : 'Selecione uma gaiola'}
              </div>
            </div>
          </div>
          <div style={S.panelBody}>
            {selectedGaiola ? (
              <>
                {/* Female ComboBox */}
                <div style={{ marginBottom: 16 }}>
                  <div style={S.label}>Femea</div>
                  <select
                    style={S.select}
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

                <div style={S.divider} />

                {/* Male ComboBox */}
                <div style={{ marginBottom: 16 }}>
                  <div style={S.label}>Macho</div>
                  <select
                    style={S.select}
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

                <div style={S.divider} />

                {/* Mutation Simulator Note */}
                <button
                  style={{ ...S.btnSecondary, width: '100%', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                  onClick={() => alert('Navegar para Simulacao de Mutacao dos Filhotes (tela a integrar)')}
                >
                  Simulacao Mutacao dos Filhotes
                </button>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 6, textAlign: 'center' }}>
                  Abre o simulador de previsao genetica
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit' }}>
                Selecione uma gaiola para ver o casal
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Eggs Gallery ─────────────────────────────────── */}
        <div className="module-panel" style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelTitle}>Ovos</div>
              <div style={S.panelSub}>
                {selectedGaiola
                  ? `${cageEggs.length} ovo(s) — ${selectedGaiola.NumeroGaiola}${selectedNinhada ? ` · ninhada ${selectedNinhada.Numero}` : ''}`
                  : 'Selecione uma gaiola'}
              </div>
            </div>
            {selectedGaiola && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={S.btnSecondary} onClick={handleRestartClutch}>
                  Reiniciar nova ninhada
                </button>
                <button style={S.btn} onClick={handleAddEgg}>
                  + Adicionar Ovo
                </button>
              </div>
            )}
          </div>
          <div style={S.panelBody}>
            {!selectedGaiola ? (
              <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit' }}>
                Selecione uma gaiola para ver os ovos
              </div>
            ) : cageEggs.length === 0 ? (
              <>
                {cageClutches.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {cageClutches.map((item) => (
                      <button
                        key={item.id}
                        style={{ ...S.historyButton, ...(selectedNinhadaId === item.id ? S.historyButtonActive : {}) }}
                        onClick={() => setSelectedNinhadaId(item.id)}
                      >
                        Ninhada {item.Numero} · {item.Status}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--text-faint)' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>&#x1F95A;</div>
                  <div style={{ fontSize: 12, fontFamily: 'inherit', color: 'var(--text-muted)' }}>
                    {selectedNinhada
                      ? 'Nenhum ovo registrado nesta ninhada.'
                      : 'Nenhum ovo registrado nesta gaiola.'}
                  </div>
                </div>
              </>
            ) : (
              <>
                {cageClutches.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {cageClutches.map((item) => (
                      <button
                        key={item.id}
                        style={{ ...S.historyButton, ...(selectedNinhadaId === item.id ? S.historyButtonActive : {}) }}
                        onClick={() => setSelectedNinhadaId(item.id)}
                      >
                        Ninhada {item.Numero} · {item.Status}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Eggs as circles/cards */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16, justifyContent: 'center', padding: '8px 0' }}>
                  {cageEggs.map(egg => {
                    const ec = EGG_COLORS[egg.Status] || EGG_COLORS.Postura
                    return (
                      <div
                        key={egg.ID}
                        style={{
                          ...S.eggCircle,
                          background: ec.bg,
                          borderColor: ec.border,
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
                    style={{ ...S.card, cursor: 'pointer' }}
                    onClick={() => setEggPopup(egg)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                        Ovo #{egg.NumeroOvo}
                      </div>
                      <StatusBadge status={egg.Status} />
                    </div>
                    <div style={S.row}>
                      <div style={S.col}>
                        <div style={S.label}>Postura</div>
                        <div style={S.valueMuted}>{fmtDate(egg.DataPostura)}</div>
                      </div>
                      <div style={S.col}>
                        <div style={S.label}>Prev. Nascimento</div>
                        <div style={S.valueMuted}>{fmtDate(egg.DataPrevistaNascimento)}</div>
                      </div>
                    </div>
                    {egg.DataInicioChoco && (
                      <div style={S.row}>
                        <div style={S.col}>
                          <div style={S.label}>Inicio Choco</div>
                          <div style={S.valueMuted}>{fmtDate(egg.DataInicioChoco)}</div>
                        </div>
                        <div style={S.col}>
                          <div style={S.label}>Confirmacao</div>
                          <div style={S.valueMuted}>{egg.ConfirmaInicioChoco || '---'}</div>
                        </div>
                      </div>
                    )}
                    {egg.DataDescarte && (
                      <div style={{ marginTop: 4 }}>
                        <div style={S.label}>Descarte</div>
                        <div style={{ ...S.valueMuted, color: '#E05C4B' }}>{fmtDate(egg.DataDescarte)}</div>
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
