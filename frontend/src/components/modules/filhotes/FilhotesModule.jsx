import { useState, useEffect, useMemo } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { accessService } from '../../../services/access.service'
import { filhotesService } from '../../../services/filhotes.service'

const USE_MOCK = !import.meta.env.VITE_API_URL

// ─── MOCK DATA — remover quando backend estiver conectado ───────────────────
const MOCK_FILHOTES = [
  { ID: 3, NomeAve: 'Pardinha', NumeroOvo: 'Ovo-2-2025', Status: 'Plantel', DataNascimento: '18/11/2025', DataPrevistaAnilhamento: '23/11/2025', Gaiola: '001', IDMae: 7, IDPai: 13, NomeMae: 'Manchinha', MutacaoMae: 'Canela Pastel', NomePai: 'Pardinho', MutacaoPai: 'Duplo Diluído', CategoriaAve: 'Tarim', Genero: 'Femea', Mutacao: 'Canela Pastel', AnelEsquerdo: '002', RegistroFOB: '5177616' },
  { ID: 2, NomeAve: 'Pardinha', NumeroOvo: 'Ovo-1-2025', Status: 'Faleceu', DataNascimento: '17/11/2025', DataPrevistaAnilhamento: '22/11/2025', Gaiola: '001', IDMae: 7, IDPai: 13, NomeMae: 'Manchinha', MutacaoMae: 'Canela Pastel', NomePai: 'Pardinho', MutacaoPai: 'Duplo Diluído' },
]

const ESPECIES = ['Tarim', 'canário belga']

const STATUS_OPTIONS = ['Vivo', 'Faleceu', 'Plantel']

function normalizeKey(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function buildMutationCatalog(records = []) {
  return records.reduce((accumulator, item) => {
    const speciesKey = normalizeKey(item.Especie)
    if (!speciesKey) return accumulator

    const nextOptions = [
      item.MutacaoMacho,
      item.MutacaoFemea,
      item.MutacaoFilhoteMacho,
      item.MutacaoFilhoteFemea,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)

    accumulator[speciesKey] = [...new Set([...(accumulator[speciesKey] || []), ...nextOptions])]
    return accumulator
  }, {})
}

function uniqueValues(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function buildPredictionCatalog(records = []) {
  return records.reduce((accumulator, item) => {
    const speciesKey = normalizeKey(item.Especie)
    const maleKey = normalizeKey(item.MutacaoMacho)
    const femaleKey = normalizeKey(item.MutacaoFemea)

    if (!speciesKey || !maleKey || !femaleKey) return accumulator

    const pairKey = `${maleKey}|${femaleKey}`
    const currentSpecies = accumulator[speciesKey] || {}
    const currentEntry = currentSpecies[pairKey] || {
      pai: String(item.MutacaoMacho || '').trim(),
      mae: String(item.MutacaoFemea || '').trim(),
      machos: [],
      femeas: [],
    }

    currentSpecies[pairKey] = {
      ...currentEntry,
      machos: uniqueValues([...currentEntry.machos, item.MutacaoFilhoteMacho]),
      femeas: uniqueValues([...currentEntry.femeas, item.MutacaoFilhoteFemea]),
    }

    accumulator[speciesKey] = currentSpecies
    return accumulator
  }, {})
}

function isActiveFilhote(item = {}) {
  const status = normalizeKey(item.Status)
  return status !== 'faleceu' && status !== 'plantel'
}

function toIsoDate(value = '') {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  return `${match[3]}-${match[2]}-${match[1]}`
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
  valueReadonly:{ fontSize: 13, color: 'var(--text-soft)', fontFamily: 'inherit', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px' },
  row:          { display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  col:          { flex: '1 1 140px', minWidth: 0 },
  btn:          { background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none', borderRadius: 14, padding: '12px 16px', color: 'var(--text-main)', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  btnSecondary: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 16px', color: 'var(--text-main)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' },
  select:       { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', appearance: 'none' },
  input:        { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  divider:      { height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' },
  resultCard:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 },
}

const fmtDate = (d) => {
  if (!d) return '---'
  const normalized = toIsoDate(d) || d
  const dt = new Date(normalized + 'T00:00:00')
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('pt-BR')
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MODULE
// ═════════════════════════════════════════════════════════════════════════════
export function FilhotesModule() {
  const [filhotes, setFilhotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilhote, setSelectedFilhote] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [transferMode, setTransferMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [transferForm, setTransferForm] = useState({
    Nome: '',
    CategoriaAve: '',
    Genero: '',
    Gaiola: '',
    Mutacao: '',
    AnelEsquerdo: '',
    RegistroFOB: '',
    observacao: '',
  })
  const [catalogs, setCatalogs] = useState({
    especies: ESPECIES,
    gaiolas: [],
    aneis: [],
    registroFobCriatorio: '',
    mutacoesPorEspecie: {},
    predicoesPorEspecie: {},
  })
  const [allFilhotesCount, setAllFilhotesCount] = useState({ total: 0, plantel: 0, faleceu: 0 })
  const [error, setError] = useState('')
  const [deathTarget, setDeathTarget] = useState(null)

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK) {
      setTimeout(() => {
        setFilhotes(MOCK_FILHOTES)
        setLoading(false)
      }, 400)
      return
    }

    Promise.all([
      filhotesService.list(),
      accessService.getImportedSharePointData(),
    ])
      .then(([response, snapshot]) => {
        const criatorio = (snapshot.criatorios || [])[0] || {}
        const sourceItems = snapshot.filhotes || response.items || []
        setFilhotes((response.items || []).filter(isActiveFilhote))
        setAllFilhotesCount({
          total: sourceItems.length,
          plantel: sourceItems.filter((item) => normalizeKey(item.Status) === 'plantel').length,
          faleceu: sourceItems.filter((item) => normalizeKey(item.Status) === 'faleceu').length,
        })
        setCatalogs({
          especies: uniqueValues([...(snapshot.especies || []).map((item) => item.Especie), ...ESPECIES]),
          gaiolas: uniqueValues((snapshot.gaiolas || []).map((item) => item.NumeroGaiola)),
          aneis: uniqueValues(
            (snapshot.aneis || [])
              .filter((item) => normalizeKey(item.Status || 'Ativo') !== 'inativo')
              .map((item) => item.NumeroAnel),
          ),
          registroFobCriatorio: String(criatorio.RegistroFOB || criatorio.CTFCriador || '').trim(),
          mutacoesPorEspecie: buildMutationCatalog(snapshot.mutacoes || []),
          predicoesPorEspecie: buildPredictionCatalog(snapshot.mutacoes || []),
        })
        setError('')
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Não foi possível carregar os filhotes.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // ─── Select first chick on load ──────────────────────────────────────────
  useEffect(() => {
    if (filhotes.length > 0 && !selectedFilhote) {
      setSelectedFilhote(filhotes[0])
    }
  }, [filhotes, selectedFilhote])

  useEffect(() => {
    if (!selectedFilhote) return

    const initialSpecies = selectedFilhote.CategoriaAve || selectedFilhote.Especie || (catalogs.especies.length === 1 ? catalogs.especies[0] : '')
    setTransferForm({
      Nome: selectedFilhote.NomeAve || '',
      CategoriaAve: initialSpecies,
      Genero: selectedFilhote.Genero || '',
      Gaiola: selectedFilhote.Gaiola || '',
      Mutacao: selectedFilhote.Mutacao || '',
      AnelEsquerdo: selectedFilhote.AnelEsquerdo || '',
      RegistroFOB: selectedFilhote.RegistroFOB || catalogs.registroFobCriatorio || '',
      observacao: selectedFilhote.observacao || '',
    })
  }, [selectedFilhote, catalogs.especies, catalogs.registroFobCriatorio])

  // ─── Start editing ────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!selectedFilhote) return
    setEditForm({
      NomeAve: selectedFilhote.NomeAve || '',
      Status:  selectedFilhote.Status || 'Vivo',
    })
    setEditMode(true)
    setTransferMode(false)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditForm({})
  }

  const startTransfer = () => {
    if (!selectedFilhote) return
    setTransferMode(true)
    setEditMode(false)
    setError('')
  }

  const cancelTransfer = () => {
    setTransferMode(false)
  }

  const saveEdit = async () => {
    if (!selectedFilhote) return

    if (USE_MOCK) {
      const updated = { ...selectedFilhote, ...editForm }
      setFilhotes(prev => prev.map(f => f.ID === selectedFilhote.ID ? updated : f))
      setSelectedFilhote(updated)
      setEditMode(false)
      setEditForm({})
      return
    }

    try {
      const response = await filhotesService.update(selectedFilhote.ID, editForm)
      const activeItems = (response.items || []).filter(isActiveFilhote)
      setFilhotes(activeItems)
      setSelectedFilhote(isActiveFilhote(response.item) ? response.item : (activeItems[0] || null))
      setEditMode(false)
      setEditForm({})
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível salvar o filhote.')
    }
  }

  const handleMarkDeath = async () => {
    if (!deathTarget) return

    try {
      const response = await filhotesService.markDeath(deathTarget.ID)
      const activeItems = (response.items || []).filter(isActiveFilhote)
      setFilhotes(activeItems)
      setSelectedFilhote(activeItems[0] || null)
      setDeathTarget(null)
      setEditMode(false)
      setTransferMode(false)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível registrar o óbito do filhote.')
      setDeathTarget(null)
    }
  }

  const predictedMutationResults = useMemo(() => {
    if (!selectedFilhote || !transferForm.CategoriaAve) return null

    const speciesPredictions = catalogs.predicoesPorEspecie[normalizeKey(transferForm.CategoriaAve)]
    if (!speciesPredictions) return null

    const directKey = `${normalizeKey(selectedFilhote.MutacaoPai)}|${normalizeKey(selectedFilhote.MutacaoMae)}`
    const reverseKey = `${normalizeKey(selectedFilhote.MutacaoMae)}|${normalizeKey(selectedFilhote.MutacaoPai)}`
    return speciesPredictions[directKey] || speciesPredictions[reverseKey] || null
  }, [catalogs.predicoesPorEspecie, selectedFilhote, transferForm.CategoriaAve])

  const predictedMutationOptions = useMemo(() => {
    if (!predictedMutationResults) return []
    if (transferForm.Genero === 'Macho') return predictedMutationResults.machos
    if (transferForm.Genero === 'Femea') return predictedMutationResults.femeas
    return uniqueValues([...predictedMutationResults.machos, ...predictedMutationResults.femeas])
  }, [predictedMutationResults, transferForm.Genero])

  const speciesMutationOptions = catalogs.mutacoesPorEspecie[normalizeKey(transferForm.CategoriaAve)] || []
  const mutationOptionsForTransfer = predictedMutationOptions.length > 0 ? predictedMutationOptions : speciesMutationOptions

  useEffect(() => {
    if (!transferMode) return

    setTransferForm((current) => {
      const nextMutation = mutationOptionsForTransfer.includes(current.Mutacao)
        ? current.Mutacao
        : (mutationOptionsForTransfer[0] || '')
      const nextRegistro = current.RegistroFOB || catalogs.registroFobCriatorio || ''

      if (nextMutation === current.Mutacao && nextRegistro === current.RegistroFOB) {
        return current
      }

      return {
        ...current,
        Mutacao: nextMutation,
        RegistroFOB: nextRegistro,
      }
    })
  }, [transferMode, mutationOptionsForTransfer, catalogs.registroFobCriatorio])

  const setTransferField = (field, value) => {
    setTransferForm((current) => ({ ...current, [field]: value }))
  }

  const handleTransferToPlantel = async () => {
    if (!selectedFilhote) return

    try {
      const response = await filhotesService.transferToPlantel(selectedFilhote.ID, transferForm)
      const activeItems = (response.items || []).filter(isActiveFilhote)
      setFilhotes(activeItems)
      setSelectedFilhote(activeItems[0] || null)
      setTransferMode(false)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível enviar o filhote ao plantel.')
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: allFilhotesCount.total,
    vivos: filhotes.filter((f) => normalizeKey(f.Status) === 'vivo').length,
    plantel: allFilhotesCount.plantel,
    faleceu: allFilhotesCount.faleceu,
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
      Carregando filhotes...
    </div>
  )

  return (
    <div>
      {error ? (
        <div style={{ background: 'rgba(224,92,75,0.12)', border: '1px solid rgba(224,92,75,0.24)', borderRadius: 12, padding: '12px 14px', color: '#ffc9c1', marginBottom: 14, fontSize: 12, fontFamily: 'inherit' }}>
          {error}
        </div>
      ) : null}

      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Nascimento e genética</div>
          <h2 className="module-hero__title">Gestão de filhotes</h2>
          <div className="module-hero__text">
            Acompanhe evolução dos filhotes, revise dados herdados dos pais e use a previsão genética para apoiar decisões de plantel.
          </div>
        </div>
        <div className="pill">Nova geração</div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Filhotes"  value={stats.total}   desc="filhotes registrados" color="#5BC0EB" />
        <StatCard label="Vivos"           value={stats.vivos}   desc="filhotes vivos"       color="#4CAF7D" />
        <StatCard label="Plantel"         value={stats.plantel} desc="fora da lista ativa"   color="#C95025" />
        <StatCard label="Falecidos"       value={stats.faleceu} desc="fora da lista ativa"   color="#E05C4B" />
      </div>

      {/* 3-Panel Layout */}
      <div style={S.container}>

        {/* ─── LEFT PANEL: Chicks Gallery ────────────────────────────────── */}
        <div className="module-panel" style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelTitle}>Filhotes</div>
              <div style={S.panelSub}>{filhotes.length} registros</div>
            </div>
          </div>
          <div style={S.panelBody}>
            {filhotes.map(f => (
              <div
                key={f.ID}
                style={{
                  ...S.card,
                  ...(selectedFilhote?.ID === f.ID ? S.cardSelected : {}),
                }}
                onClick={() => { setSelectedFilhote(f); setEditMode(false); setTransferMode(false) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                    {f.NomeAve || `Filhote (Ovo #${f.NumeroOvo})`}
                  </div>
                  <StatusBadge status={f.Status} />
                </div>
                <div style={S.row}>
                  <div style={S.col}>
                    <div style={S.label}>Nascimento</div>
                    <div style={S.valueMuted}>{fmtDate(f.DataNascimento)}</div>
                  </div>
                  <div style={S.col}>
                    <div style={S.label}>Gaiola</div>
                    <div style={S.valueMuted}>{f.Gaiola}</div>
                  </div>
                </div>
                <div style={S.row}>
                  <div style={S.col}>
                    <div style={S.label}>Mae</div>
                    <div style={S.valueMuted}>{f.NomeMae}</div>
                  </div>
                  <div style={S.col}>
                    <div style={S.label}>Pai</div>
                    <div style={S.valueMuted}>{f.NomePai}</div>
                  </div>
                </div>
                {f.DataPrevistaAnilhamento && (
                  <div style={{ marginTop: 4 }}>
                    <div style={S.label}>Prev. Anilhamento</div>
                    <div style={S.valueMuted}>{fmtDate(f.DataPrevistaAnilhamento)}</div>
                  </div>
                )}
              </div>
            ))}
            {filhotes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit' }}>
                Nenhum filhote ativo no momento. Os registros que já foram enviados ao plantel ou marcados como falecidos saem desta lista.
              </div>
            )}
          </div>
        </div>

        {/* ─── MIDDLE PANEL: Chick Detail Form ──────────────────────────── */}
        <div className="module-panel" style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelTitle}>
                {selectedFilhote
                  ? (selectedFilhote.NomeAve || `Filhote (Ovo #${selectedFilhote.NumeroOvo})`)
                  : 'Detalhes do Filhote'}
              </div>
              {selectedFilhote && (
                <div style={S.panelSub}>
                  Nascimento: {fmtDate(selectedFilhote.DataNascimento)}
                </div>
              )}
            </div>
            {selectedFilhote && !editMode && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedFilhote.Status !== 'Faleceu' && selectedFilhote.Status !== 'Plantel' ? (
                  <>
                    <button style={S.btn} onClick={startEdit}>Editar</button>
                    <button style={S.btnSecondary} onClick={startTransfer}>Cadastrar no plantel</button>
                    <button style={{ ...S.btnSecondary, borderColor: 'rgba(224,92,75,0.24)', color: '#ffc9c1' }} onClick={() => setDeathTarget(selectedFilhote)}>Sinalizar morte</button>
                  </>
                ) : null}
              </div>
            )}
            {editMode && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.btn} onClick={saveEdit}>Salvar</button>
                <button style={S.btnSecondary} onClick={cancelEdit}>Cancelar</button>
              </div>
            )}
          </div>
          <div style={S.panelBody}>
            {!selectedFilhote ? (
              <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit' }}>
                Selecione um filhote para ver os detalhes
              </div>
            ) : transferMode ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: 'inherit', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Transferir para o plantel
                  </div>
                  <div style={{ color: 'var(--text-soft)', fontSize: 12, lineHeight: 1.7, marginBottom: 14, fontFamily: 'inherit' }}>
                    Escolha a gaiola final, selecione um anel cadastrado e use a previsão genética do casal para definir a mutação do filhote.
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={S.label}>Nome final</div>
                    <input style={S.input} value={transferForm.Nome} onChange={(e) => setTransferField('Nome', e.target.value)} />
                  </div>

                  <div style={S.row}>
                    <div style={S.col}>
                      <div style={S.label}>Espécie</div>
                      <select style={S.select} value={transferForm.CategoriaAve} onChange={(e) => setTransferField('CategoriaAve', e.target.value)}>
                        <option value="">Selecionar</option>
                        {catalogs.especies.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div style={S.col}>
                      <div style={S.label}>Gênero</div>
                      <select style={S.select} value={transferForm.Genero} onChange={(e) => setTransferField('Genero', e.target.value)}>
                        <option value="">Selecionar</option>
                        <option value="Macho">Macho</option>
                        <option value="Femea">Fêmea</option>
                      </select>
                    </div>
                  </div>

                  <div style={S.row}>
                    <div style={S.col}>
                        <div style={S.label}>Gaiola de destino</div>
                        <select style={S.select} value={transferForm.Gaiola} onChange={(e) => setTransferField('Gaiola', e.target.value)}>
                          <option value="">Selecionar</option>
                          {catalogs.gaiolas.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </div>
                      {mutationOptionsForTransfer.length > 0 ? (
                        <div style={S.col}>
                          <div style={S.label}>Mutação prevista</div>
                          <select style={S.select} value={transferForm.Mutacao} onChange={(e) => setTransferField('Mutacao', e.target.value)}>
                            <option value="">Selecionar</option>
                            {mutationOptionsForTransfer.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>
                    ) : null}
                  </div>

                  <div style={S.row}>
                    <div style={S.col}>
                      <div style={S.label}>Anel cadastrado</div>
                      <select style={S.select} value={transferForm.AnelEsquerdo} onChange={(e) => setTransferField('AnelEsquerdo', e.target.value)}>
                        <option value="">Selecionar</option>
                        {catalogs.aneis.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div style={S.col}>
                      <div style={S.label}>Registro FOB do criatório</div>
                      <input
                        style={{ ...S.input, color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)' }}
                        value={transferForm.RegistroFOB}
                        readOnly
                      />
                    </div>
                  </div>

                  {predictedMutationResults ? (
                    <div style={{ background: 'rgba(91,192,235,0.08)', border: '1px solid rgba(91,192,235,0.18)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
                      <div style={{ ...S.label, marginBottom: 8 }}>Previsão automática aplicada</div>
                      <div style={{ color: '#DCEFF8', fontSize: 12, lineHeight: 1.7, fontFamily: 'inherit' }}>
                        Pai: {predictedMutationResults.pai || selectedFilhote.MutacaoPai || '---'}
                        <br />
                        Mãe: {predictedMutationResults.mae || selectedFilhote.MutacaoMae || '---'}
                        <br />
                        Opções do filhote: {mutationOptionsForTransfer.join(', ') || 'Sem previsão cadastrada'}
                      </div>
                    </div>
                  ) : null}

                  <div style={{ marginBottom: 14 }}>
                    <div style={S.label}>Observações finais</div>
                    <textarea style={{ ...S.input, minHeight: 96, resize: 'vertical' }} value={transferForm.observacao} onChange={(e) => setTransferField('observacao', e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button style={S.btn} onClick={handleTransferToPlantel}>Enviar ao plantel</button>
                    <button style={S.btnSecondary} onClick={cancelTransfer}>Cancelar</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Parent Info (read-only) */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: 'inherit', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Informacoes dos Pais
                  </div>
                  <div style={S.row}>
                    <div style={S.col}>
                      <div style={S.label}>Nome Mae</div>
                      <div style={S.valueReadonly}>{selectedFilhote.NomeMae}</div>
                    </div>
                    <div style={S.col}>
                      <div style={S.label}>Mutacao Mae</div>
                      <div style={S.valueReadonly}>{selectedFilhote.MutacaoMae}</div>
                    </div>
                  </div>
                  <div style={S.row}>
                    <div style={S.col}>
                      <div style={S.label}>Nome Pai</div>
                      <div style={S.valueReadonly}>{selectedFilhote.NomePai}</div>
                    </div>
                    <div style={S.col}>
                      <div style={S.label}>Mutacao Pai</div>
                      <div style={S.valueReadonly}>{selectedFilhote.MutacaoPai}</div>
                    </div>
                  </div>
                </div>

                <div style={S.divider} />

                {/* Chick Info */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: 'inherit', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dados do Filhote
                  </div>

                  {/* NomeAve (editable) */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={S.label}>Nome da Ave</div>
                    {editMode ? (
                      <input
                        type="text"
                        style={S.input}
                        value={editForm.NomeAve}
                        onChange={e => setEditForm(f => ({ ...f, NomeAve: e.target.value }))}
                        placeholder="Digite o nome do filhote"
                      />
                    ) : (
                      <div style={S.value}>{selectedFilhote.NomeAve || '(sem nome)'}</div>
                    )}
                  </div>

                  {/* Status (dropdown in edit) */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={S.label}>Status</div>
                    {editMode ? (
                      <select
                        style={S.select}
                        value={editForm.Status}
                        onChange={e => setEditForm(f => ({ ...f, Status: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={selectedFilhote.Status} />
                    )}
                  </div>

                  {/* Gaiola (read-only) */}
                  <div style={S.row}>
                    <div style={S.col}>
                      <div style={S.label}>Gaiola</div>
                      <div style={S.valueReadonly}>{selectedFilhote.Gaiola}</div>
                    </div>
                    <div style={S.col}>
                      <div style={S.label}>Numero Ovo</div>
                      <div style={S.valueReadonly}>#{selectedFilhote.NumeroOvo}</div>
                    </div>
                  </div>

                  <div style={S.row}>
                    <div style={S.col}>
                      <div style={S.label}>Data Nascimento</div>
                      <div style={S.valueReadonly}>{fmtDate(toIsoDate(selectedFilhote.DataNascimento) || selectedFilhote.DataNascimento)}</div>
                    </div>
                    <div style={S.col}>
                      <div style={S.label}>Prev. Anilhamento</div>
                      <div style={S.valueReadonly}>{fmtDate(toIsoDate(selectedFilhote.DataPrevistaAnilhamento) || selectedFilhote.DataPrevistaAnilhamento)}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Mutation Prediction ──────────────────────────── */}
        <div className="module-panel" style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelTitle}>Previsao de Mutacao</div>
              <div style={S.panelSub}>Analise automática do casal</div>
            </div>
          </div>
          <div style={S.panelBody}>
            {!selectedFilhote ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit' }}>
                Selecione um filhote para analisar a previsão genética.
              </div>
            ) : !transferForm.CategoriaAve ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit' }}>
                Selecione a espécie do filhote para cruzar as mutações do pai e da mãe.
              </div>
            ) : !predictedMutationResults ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>&#x1F9EC;</div>
                Cruzamento não encontrado na tabela de mutações da espécie selecionada.
                <br />
                Cadastre essa combinação no módulo de Mutações para habilitar a previsão automática.
              </div>
            ) : (
              <>
                <div style={{ ...S.resultCard, marginBottom: 16 }}>
                  <div style={S.label}>Base do cálculo</div>
                  <div style={{ color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.8 }}>
                    Espécie: {transferForm.CategoriaAve}
                    <br />
                    Pai: {predictedMutationResults.pai || selectedFilhote.MutacaoPai || '---'}
                    <br />
                    Mãe: {predictedMutationResults.mae || selectedFilhote.MutacaoMae || '---'}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#5BC0EB', fontFamily: 'inherit', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Filhotes Machos
                  </div>
                  {predictedMutationResults.machos.length === 0 ? (
                    <div style={S.resultCard}>
                      <span style={{ fontSize: 13, color: 'var(--text-soft)', fontFamily: 'inherit' }}>Sem previsão masculina cadastrada.</span>
                    </div>
                  ) : predictedMutationResults.machos.map((mut) => (
                    <div key={mut} style={S.resultCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5BC0EB', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-main)', fontFamily: 'inherit' }}>{mut}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filhotes Femeas */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E88DB4', fontFamily: 'inherit', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Filhotes Femeas
                  </div>
                  {predictedMutationResults.femeas.length === 0 ? (
                    <div style={S.resultCard}>
                      <span style={{ fontSize: 13, color: 'var(--text-soft)', fontFamily: 'inherit' }}>Sem previsão feminina cadastrada.</span>
                    </div>
                  ) : predictedMutationResults.femeas.map((mut) => (
                    <div key={mut} style={S.resultCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E88DB4', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-main)', fontFamily: 'inherit' }}>{mut}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {deathTarget ? (
        <ConfirmModal
          title="Registrar óbito do filhote?"
          message={`O filhote "${deathTarget.NomeAve || `Ovo #${deathTarget.NumeroOvo}`}" será marcado como falecido.`}
          confirmLabel="Confirmar óbito"
          danger
          onConfirm={handleMarkDeath}
          onCancel={() => setDeathTarget(null)}
        />
      ) : null}
    </div>
  )
}
