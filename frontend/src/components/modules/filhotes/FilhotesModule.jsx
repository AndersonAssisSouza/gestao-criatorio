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
    <div className="flex items-center justify-center text-muted" style={{ height: '50vh', fontSize: 13 }}>
      Carregando filhotes...
    </div>
  )

  return (
    <div>
      {error ? (
        <div className="p-alert--error mb-2">
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
      <div className="p-stats mb-3">
        <StatCard label="Total Filhotes"  value={stats.total}   desc="filhotes registrados" color="#5BC0EB" />
        <StatCard label="Vivos"           value={stats.vivos}   desc="filhotes vivos"       color="#4CAF7D" />
        <StatCard label="Plantel"         value={stats.plantel} desc="fora da lista ativa"   color="#C95025" />
        <StatCard label="Falecidos"       value={stats.faleceu} desc="fora da lista ativa"   color="#E05C4B" />
      </div>

      {/* 3-Panel Layout */}
      <div className="p-split p-split--3">

        {/* ─── LEFT PANEL: Chicks Gallery ────────────────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Filhotes</div>
              <div className="p-panel-header__subtitle">{filhotes.length} registros</div>
            </div>
          </div>
          <div className="p-panel-body">
            {filhotes.map(f => (
              <div
                key={f.ID}
                className={`p-list-item${selectedFilhote?.ID === f.ID ? ' is-active' : ''}`}
                onClick={() => { setSelectedFilhote(f); setEditMode(false); setTransferMode(false) }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-serif" style={{ fontSize: 14, fontWeight: 700 }}>
                    {f.NomeAve || `Filhote (Ovo #${f.NumeroOvo})`}
                  </div>
                  <StatusBadge status={f.Status} />
                </div>
                <div className="p-form-grid">
                  <div className="p-field">
                    <div className="p-label">Nascimento</div>
                    <div className="text-muted">{fmtDate(f.DataNascimento)}</div>
                  </div>
                  <div className="p-field">
                    <div className="p-label">Gaiola</div>
                    <div className="text-muted">{f.Gaiola}</div>
                  </div>
                </div>
                <div className="p-form-grid">
                  <div className="p-field">
                    <div className="p-label">Mae</div>
                    <div className="text-muted">{f.NomeMae}</div>
                  </div>
                  <div className="p-field">
                    <div className="p-label">Pai</div>
                    <div className="text-muted">{f.NomePai}</div>
                  </div>
                </div>
                {f.DataPrevistaAnilhamento && (
                  <div className="p-field mt-1">
                    <div className="p-label">Prev. Anilhamento</div>
                    <div className="text-muted">{fmtDate(f.DataPrevistaAnilhamento)}</div>
                  </div>
                )}
              </div>
            ))}
            {filhotes.length === 0 && (
              <div className="module-empty">
                Nenhum filhote ativo no momento. Os registros que já foram enviados ao plantel ou marcados como falecidos saem desta lista.
              </div>
            )}
          </div>
        </div>

        {/* ─── MIDDLE PANEL: Chick Detail Form ──────────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">
                {selectedFilhote
                  ? (selectedFilhote.NomeAve || `Filhote (Ovo #${selectedFilhote.NumeroOvo})`)
                  : 'Detalhes do Filhote'}
              </div>
              {selectedFilhote && (
                <div className="p-panel-header__subtitle">
                  Nascimento: {fmtDate(selectedFilhote.DataNascimento)}
                </div>
              )}
            </div>
            {selectedFilhote && !editMode && (
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                {selectedFilhote.Status !== 'Faleceu' && selectedFilhote.Status !== 'Plantel' ? (
                  <>
                    <button className="p-btn p-btn--primary" onClick={startEdit}>Editar</button>
                    <button className="p-btn p-btn--secondary" onClick={startTransfer}>Cadastrar no plantel</button>
                    <button className="p-btn p-btn--danger" onClick={() => setDeathTarget(selectedFilhote)}>Sinalizar morte</button>
                  </>
                ) : null}
              </div>
            )}
            {editMode && (
              <div className="flex gap-1">
                <button className="p-btn p-btn--primary" onClick={saveEdit}>Salvar</button>
                <button className="p-btn p-btn--secondary" onClick={cancelEdit}>Cancelar</button>
              </div>
            )}
          </div>
          <div className="p-panel-body">
            {!selectedFilhote ? (
              <div className="module-empty">
                Selecione um filhote para ver os detalhes
              </div>
            ) : transferMode ? (
              <>
                <div className="mb-2">
                  <div className="text-accent" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Transferir para o plantel
                  </div>
                  <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
                    Escolha a gaiola final, selecione um anel cadastrado e use a previsão genética do casal para definir a mutação do filhote.
                  </div>

                  <div className="p-field mb-2">
                    <div className="p-label">Nome final</div>
                    <input className="p-input" value={transferForm.Nome} onChange={(e) => setTransferField('Nome', e.target.value)} />
                  </div>

                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Espécie</div>
                      <select className="p-select" value={transferForm.CategoriaAve} onChange={(e) => setTransferField('CategoriaAve', e.target.value)}>
                        <option value="">Selecionar</option>
                        {catalogs.especies.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Gênero</div>
                      <select className="p-select" value={transferForm.Genero} onChange={(e) => setTransferField('Genero', e.target.value)}>
                        <option value="">Selecionar</option>
                        <option value="Macho">Macho</option>
                        <option value="Femea">Fêmea</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-form-grid">
                    <div className="p-field">
                        <div className="p-label">Gaiola de destino</div>
                        <select className="p-select" value={transferForm.Gaiola} onChange={(e) => setTransferField('Gaiola', e.target.value)}>
                          <option value="">Selecionar</option>
                          {catalogs.gaiolas.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </div>
                      {mutationOptionsForTransfer.length > 0 ? (
                        <div className="p-field">
                          <div className="p-label">Mutação prevista</div>
                          <select className="p-select" value={transferForm.Mutacao} onChange={(e) => setTransferField('Mutacao', e.target.value)}>
                            <option value="">Selecionar</option>
                            {mutationOptionsForTransfer.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>
                    ) : null}
                  </div>

                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Anel cadastrado</div>
                      <select className="p-select" value={transferForm.AnelEsquerdo} onChange={(e) => setTransferField('AnelEsquerdo', e.target.value)}>
                        <option value="">Selecionar</option>
                        {catalogs.aneis.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Registro FOB do criatório</div>
                      <input
                        className="p-input"
                        style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)' }}
                        value={transferForm.RegistroFOB}
                        readOnly
                      />
                    </div>
                  </div>

                  {predictedMutationResults ? (
                    <div className="p-alert--success mb-2" style={{ background: 'rgba(91,192,235,0.08)', borderColor: 'rgba(91,192,235,0.18)' }}>
                      <div className="p-label mb-1">Previsão automática aplicada</div>
                      <div style={{ color: '#DCEFF8', fontSize: 12, lineHeight: 1.7 }}>
                        Pai: {predictedMutationResults.pai || selectedFilhote.MutacaoPai || '---'}
                        <br />
                        Mãe: {predictedMutationResults.mae || selectedFilhote.MutacaoMae || '---'}
                        <br />
                        Opções do filhote: {mutationOptionsForTransfer.join(', ') || 'Sem previsão cadastrada'}
                      </div>
                    </div>
                  ) : null}

                  <div className="p-field mb-2">
                    <div className="p-label">Observações finais</div>
                    <textarea className="p-textarea" style={{ minHeight: 96, resize: 'vertical' }} value={transferForm.observacao} onChange={(e) => setTransferField('observacao', e.target.value)} />
                  </div>

                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    <button className="p-btn p-btn--primary" onClick={handleTransferToPlantel}>Enviar ao plantel</button>
                    <button className="p-btn p-btn--secondary" onClick={cancelTransfer}>Cancelar</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Parent Info (read-only) */}
                <div className="mb-2">
                  <div className="text-accent" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Informacoes dos Pais
                  </div>
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Nome Mae</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{selectedFilhote.NomeMae}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Mutacao Mae</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{selectedFilhote.MutacaoMae}</div>
                    </div>
                  </div>
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Nome Pai</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{selectedFilhote.NomePai}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Mutacao Pai</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{selectedFilhote.MutacaoPai}</div>
                    </div>
                  </div>
                </div>

                <hr className="p-divider" />

                {/* Chick Info */}
                <div className="mb-2">
                  <div className="text-accent" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dados do Filhote
                  </div>

                  {/* NomeAve (editable) */}
                  <div className="p-field mb-2">
                    <div className="p-label">Nome da Ave</div>
                    {editMode ? (
                      <input
                        type="text"
                        className="p-input"
                        value={editForm.NomeAve}
                        onChange={e => setEditForm(f => ({ ...f, NomeAve: e.target.value }))}
                        placeholder="Digite o nome do filhote"
                      />
                    ) : (
                      <div className="text-main">{selectedFilhote.NomeAve || '(sem nome)'}</div>
                    )}
                  </div>

                  {/* Status (dropdown in edit) */}
                  <div className="p-field mb-2">
                    <div className="p-label">Status</div>
                    {editMode ? (
                      <select
                        className="p-select"
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
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Gaiola</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{selectedFilhote.Gaiola}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Numero Ovo</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>#{selectedFilhote.NumeroOvo}</div>
                    </div>
                  </div>

                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Data Nascimento</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{fmtDate(toIsoDate(selectedFilhote.DataNascimento) || selectedFilhote.DataNascimento)}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Prev. Anilhamento</div>
                      <div className="p-input" style={{ color: 'var(--text-soft)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{fmtDate(toIsoDate(selectedFilhote.DataPrevistaAnilhamento) || selectedFilhote.DataPrevistaAnilhamento)}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Mutation Prediction ──────────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Previsao de Mutacao</div>
              <div className="p-panel-header__subtitle">Analise automática do casal</div>
            </div>
          </div>
          <div className="p-panel-body">
            {!selectedFilhote ? (
              <div className="module-empty">
                Selecione um filhote para analisar a previsão genética.
              </div>
            ) : !transferForm.CategoriaAve ? (
              <div className="module-empty">
                Selecione a espécie do filhote para cruzar as mutações do pai e da mãe.
              </div>
            ) : !predictedMutationResults ? (
              <div className="module-empty">
                <div style={{ fontSize: 28, marginBottom: 8 }}>&#x1F9EC;</div>
                Cruzamento não encontrado na tabela de mutações da espécie selecionada.
                <br />
                Cadastre essa combinação no módulo de Mutações para habilitar a previsão automática.
              </div>
            ) : (
              <>
                <div className="p-list-item mb-2">
                  <div className="p-label">Base do cálculo</div>
                  <div className="text-main" style={{ fontSize: 13, lineHeight: 1.8 }}>
                    Espécie: {transferForm.CategoriaAve}
                    <br />
                    Pai: {predictedMutationResults.pai || selectedFilhote.MutacaoPai || '---'}
                    <br />
                    Mãe: {predictedMutationResults.mae || selectedFilhote.MutacaoMae || '---'}
                  </div>
                </div>

                <div className="mb-2">
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#5BC0EB', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Filhotes Machos
                  </div>
                  {predictedMutationResults.machos.length === 0 ? (
                    <div className="p-list-item">
                      <span className="text-muted" style={{ fontSize: 13 }}>Sem previsão masculina cadastrada.</span>
                    </div>
                  ) : predictedMutationResults.machos.map((mut) => (
                    <div key={mut} className="p-list-item">
                      <div className="flex items-center gap-1">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5BC0EB', flexShrink: 0 }} />
                        <span className="text-main" style={{ fontSize: 13 }}>{mut}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filhotes Femeas */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E88DB4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Filhotes Femeas
                  </div>
                  {predictedMutationResults.femeas.length === 0 ? (
                    <div className="p-list-item">
                      <span className="text-muted" style={{ fontSize: 13 }}>Sem previsão feminina cadastrada.</span>
                    </div>
                  ) : predictedMutationResults.femeas.map((mut) => (
                    <div key={mut} className="p-list-item">
                      <div className="flex items-center gap-1">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E88DB4', flexShrink: 0 }} />
                        <span className="text-main" style={{ fontSize: 13 }}>{mut}</span>
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
