import { useState, useEffect, useMemo } from 'react'
import { StatCard } from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { accessService } from '../../../services/access.service'
import { filhotesService } from '../../../services/filhotes.service'
import { CROSSING_DB, getMutationColor } from '../mutacoes/MutacoesModule'

const USE_MOCK = !import.meta.env.VITE_API_URL

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_FILHOTES = [
  { ID: 4, NomeAve: '', NumeroOvo: 'Ovo-3-2026', Status: 'Vivo', DataNascimento: '15/04/2026', DataPrevistaAnilhamento: '20/04/2026', Gaiola: '001', IDMae: 4, IDPai: 9, NomeMae: 'Manchinha', MutacaoMae: 'Canela Pastel', NomePai: 'Pardinho', MutacaoPai: 'Duplo Diluído', CategoriaAve: 'Tarim', Genero: '', Mutacao: '', AnelEsquerdo: '', RegistroFOB: '5177616' },
  { ID: 3, NomeAve: 'Pardinha', NumeroOvo: 'Ovo-2-2025', Status: 'Plantel', DataNascimento: '18/11/2025', DataPrevistaAnilhamento: '23/11/2025', Gaiola: '001', IDMae: 7, IDPai: 13, NomeMae: 'Manchinha', MutacaoMae: 'Canela Pastel', NomePai: 'Pardinho', MutacaoPai: 'Duplo Diluído', CategoriaAve: 'Tarim', Genero: 'Femea', Mutacao: 'Canela Pastel', AnelEsquerdo: '002', RegistroFOB: '5177616' },
  { ID: 2, NomeAve: 'Pardinha', NumeroOvo: 'Ovo-1-2025', Status: 'Faleceu', DataNascimento: '17/11/2025', DataPrevistaAnilhamento: '22/11/2025', Gaiola: '001', IDMae: 7, IDPai: 13, NomeMae: 'Manchinha', MutacaoMae: 'Canela Pastel', NomePai: 'Pardinho', MutacaoPai: 'Duplo Diluído' },
]

const ESPECIES = ['Tarim', 'canário belga']
const STATUS_FILHOTE = ['Vivo', 'Faleceu']
const MOCK_GAIOLAS = ['001', '002', '003']
const MOCK_ANEIS = ['033', '002', 'JI783']

function normalizeKey(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function normalizeText(value = '') {
  return normalizeKey(value)
}

const SPECIES_MAP = { tarim: 'Tarim', tarin: 'Tarim' }  // aceita ambas grafias
function normalizeSpecies(name = '') {
  const key = normalizeText(name)
  return SPECIES_MAP[key] || name
}

function isActiveFilhote(item = {}) {
  const status = normalizeKey(item.Status)
  return status === 'vivo'
}

function uniqueValues(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
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

// ─── Busca cruzamento no CROSSING_DB ───────────────────────────────────────
function findCrossing(especie, mutMacho, mutFemea) {
  if (!especie || !mutMacho || !mutFemea) return null
  const sp = normalizeSpecies(especie)
  return CROSSING_DB.find(c => c.especie === sp && c.macho === mutMacho && c.femea === mutFemea) || null
}

// ─── Mini badge de mutação ─────────────────────────────────────────────────
function MiniMutBadge({ name, percentual }) {
  const color = getMutationColor(name)
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 6, fontSize: 11,
      background: `${color}18`, border: `1px solid ${color}40`,
      marginBottom: 4, marginRight: 4,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color: '#2c2520' }}>{name}</span>
      {percentual && <span style={{ color, fontWeight: 600 }}>{percentual}</span>}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MODULE
// ═════════════════════════════════════════════════════════════════════════════
export function FilhotesModule() {
  const [allFilhotes, setAllFilhotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilhote, setSelectedFilhote] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [transferMode, setTransferMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [transferForm, setTransferForm] = useState({
    Nome: '', CategoriaAve: '', Genero: '', Gaiola: '', Mutacao: '', AnelEsquerdo: '', RegistroFOB: '', observacao: '',
  })
  const [catalogs, setCatalogs] = useState({
    especies: ESPECIES, gaiolas: MOCK_GAIOLAS, aneis: MOCK_ANEIS, registroFobCriatorio: '5177616',
  })
  const [error, setError] = useState('')
  const [deathTarget, setDeathTarget] = useState(null)

  // ─── Filhotes vivos (não cadastrados no plantel) ─────────────────────────
  const filhotes = useMemo(() => allFilhotes.filter(isActiveFilhote), [allFilhotes])

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK) {
      setTimeout(() => {
        setAllFilhotes(MOCK_FILHOTES)
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
        setAllFilhotes(response.items || [])
        setCatalogs({
          especies: uniqueValues([...(snapshot.especies || []).map((item) => item.Especie), ...ESPECIES]),
          gaiolas: uniqueValues((snapshot.gaiolas || []).map((item) => item.NumeroGaiola)),
          aneis: uniqueValues(
            (snapshot.aneis || [])
              .filter((item) => normalizeKey(item.Status || 'Ativo') !== 'inativo')
              .map((item) => item.NumeroAnel),
          ),
          registroFobCriatorio: String(criatorio.RegistroFOB || criatorio.CTFCriador || '').trim(),
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

  // ─── Sync transfer form when selected filhote changes ────────────────────
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

  // ─── Previsão genética via CROSSING_DB ───────────────────────────────────
  const crossing = useMemo(() => {
    if (!selectedFilhote) return null
    const especie = selectedFilhote.CategoriaAve || transferForm.CategoriaAve
    return findCrossing(especie, selectedFilhote.MutacaoPai, selectedFilhote.MutacaoMae)
  }, [selectedFilhote, transferForm.CategoriaAve])

  const mutationOptionsForTransfer = useMemo(() => {
    if (!crossing) return []
    if (crossing.isCrossingOver) {
      const normal = [...(crossing.resultadoNormal?.machos || []), ...(crossing.resultadoNormal?.femeas || [])]
      const co = [...(crossing.resultadoCrossOver?.machos || []), ...(crossing.resultadoCrossOver?.femeas || [])]
      return uniqueValues([...normal, ...co].map(r => r.mutacao))
    }
    if (transferForm.Genero === 'Macho') return uniqueValues(crossing.resultadoMachos.map(r => r.mutacao))
    if (transferForm.Genero === 'Femea') return uniqueValues(crossing.resultadoFemeas.map(r => r.mutacao))
    return uniqueValues([...crossing.resultadoMachos, ...crossing.resultadoFemeas].map(r => r.mutacao))
  }, [crossing, transferForm.Genero])

  // ─── Edit actions ────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!selectedFilhote) return
    setEditForm({
      NomeAve: selectedFilhote.NomeAve || '',
      Status: selectedFilhote.Status || 'Vivo',
      Genero: selectedFilhote.Genero || '',
    })
    setEditMode(true)
    setTransferMode(false)
  }

  const cancelEdit = () => { setEditMode(false); setEditForm({}) }

  const startTransfer = () => {
    if (!selectedFilhote) return
    setTransferMode(true)
    setEditMode(false)
    setError('')
  }

  const cancelTransfer = () => { setTransferMode(false) }

  const saveEdit = async () => {
    if (!selectedFilhote) return

    if (USE_MOCK) {
      const updated = { ...selectedFilhote, ...editForm }
      setAllFilhotes(prev => prev.map(f => f.ID === selectedFilhote.ID ? updated : f))
      setSelectedFilhote(isActiveFilhote(updated) ? updated : null)
      setEditMode(false)
      setEditForm({})
      return
    }

    try {
      const response = await filhotesService.update(selectedFilhote.ID, editForm)
      setAllFilhotes(response.items || [])
      setSelectedFilhote(isActiveFilhote(response.item) ? response.item : null)
      setEditMode(false)
      setEditForm({})
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível salvar o filhote.')
    }
  }

  const handleMarkDeath = async () => {
    if (!deathTarget) return

    if (USE_MOCK) {
      const updated = { ...deathTarget, Status: 'Faleceu' }
      setAllFilhotes(prev => prev.map(f => f.ID === deathTarget.ID ? updated : f))
      setSelectedFilhote(null)
      setDeathTarget(null)
      setEditMode(false)
      setTransferMode(false)
      return
    }

    try {
      const response = await filhotesService.markDeath(deathTarget.ID)
      setAllFilhotes(response.items || [])
      setSelectedFilhote(null)
      setDeathTarget(null)
      setEditMode(false)
      setTransferMode(false)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível registrar o óbito do filhote.')
      setDeathTarget(null)
    }
  }

  const handleTransferToPlantel = async () => {
    if (!selectedFilhote) return

    if (USE_MOCK) {
      const updated = { ...selectedFilhote, Status: 'Plantel', ...transferForm }
      setAllFilhotes(prev => prev.map(f => f.ID === selectedFilhote.ID ? updated : f))
      setSelectedFilhote(null)
      setTransferMode(false)
      return
    }

    try {
      const response = await filhotesService.transferToPlantel(selectedFilhote.ID, transferForm)
      setAllFilhotes(response.items || [])
      setSelectedFilhote(null)
      setTransferMode(false)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível enviar o filhote ao plantel.')
    }
  }

  const setTransferField = (field, value) => {
    setTransferForm((current) => ({ ...current, [field]: value }))
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: allFilhotes.length,
    vivos: filhotes.length,
    plantel: allFilhotes.filter(f => normalizeKey(f.Status) === 'plantel').length,
    faleceu: allFilhotes.filter(f => normalizeKey(f.Status) === 'faleceu').length,
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center text-muted" style={{ height: '50vh', fontSize: 13 }}>
      Carregando filhotes...
    </div>
  )

  const readonlyInputStyle = { color: 'var(--text-soft)', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  return (
    <div>
      {error ? <div className="p-alert--error mb-2">{error}</div> : null}

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

      <div className="p-stats mb-3">
        <StatCard label="Total Filhotes" value={stats.total} desc="filhotes registrados" color="#5BC0EB" />
        <StatCard label="Vivos" value={stats.vivos} desc="filhotes ativos" color="#4CAF7D" />
        <StatCard label="Plantel" value={stats.plantel} desc="cadastrados no plantel" color="#C95025" />
        <StatCard label="Falecidos" value={stats.faleceu} desc="óbitos registrados" color="#E05C4B" />
      </div>

      <div className="p-split p-split--3">

        {/* ─── LEFT PANEL: Lista de filhotes vivos ───────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Filhotes Vivos</div>
              <div className="p-panel-header__subtitle">{filhotes.length} aguardando cadastro</div>
            </div>
          </div>
          <div className="p-panel-body">
            {filhotes.map(f => (
              <div
                key={f.ID}
                className={`p-list-item${selectedFilhote?.ID === f.ID ? ' is-active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => { setSelectedFilhote(f); setEditMode(false); setTransferMode(false) }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-serif" style={{ fontSize: 14, fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.NomeAve || `Filhote (Ovo #${f.NumeroOvo})`}
                  </div>
                  <StatusBadge status={f.Status} />
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{fmtDate(f.DataNascimento)}</span>
                  <span>·</span>
                  <span>Gaiola {f.Gaiola}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.NomeMae || '?'} × {f.NomePai || '?'}
                </div>
              </div>
            ))}
            {filhotes.length === 0 && (
              <div className="module-empty">
                Nenhum filhote vivo aguardando cadastro no plantel.
              </div>
            )}
          </div>
        </div>

        {/* ─── MIDDLE PANEL: Detalhes / Edição / Cadastro ────────────────── */}
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
            {selectedFilhote && !editMode && !transferMode && (
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                <button className="p-btn p-btn--secondary" onClick={startEdit}>Editar</button>
                <button className="p-btn p-btn--primary" onClick={startTransfer}>Cadastrar no Plantel</button>
              </div>
            )}
          </div>
          <div className="p-panel-body">
            {!selectedFilhote ? (
              <div className="module-empty">Selecione um filhote para ver os detalhes</div>

            ) : transferMode ? (
              /* ── Formulário de cadastro no plantel ──────────────────────── */
              <div>
                <div className="text-accent" style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Cadastrar no Plantel
                </div>

                <div className="p-field mb-2">
                  <div className="p-label">Nome da ave</div>
                  <input className="p-input" value={transferForm.Nome} onChange={(e) => setTransferField('Nome', e.target.value)} placeholder="Nome final da ave" />
                </div>

                <div className="p-form-grid">
                  <div className="p-field">
                    <div className="p-label">Espécie</div>
                    <select className="p-select" value={transferForm.CategoriaAve} onChange={(e) => setTransferField('CategoriaAve', e.target.value)}>
                      <option value="">Selecionar</option>
                      {catalogs.especies.map(item => <option key={item} value={item}>{item}</option>)}
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
                    <div className="p-label">Gaiola destino</div>
                    <select className="p-select" value={transferForm.Gaiola} onChange={(e) => setTransferField('Gaiola', e.target.value)}>
                      <option value="">Selecionar</option>
                      {catalogs.gaiolas.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="p-field">
                    <div className="p-label">Mutação</div>
                    {mutationOptionsForTransfer.length > 0 ? (
                      <select className="p-select" value={transferForm.Mutacao} onChange={(e) => setTransferField('Mutacao', e.target.value)}>
                        <option value="">Selecionar</option>
                        {mutationOptionsForTransfer.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    ) : (
                      <input className="p-input" value={transferForm.Mutacao} onChange={(e) => setTransferField('Mutacao', e.target.value)} placeholder="Informar mutação" />
                    )}
                  </div>
                </div>

                <div className="p-form-grid">
                  <div className="p-field">
                    <div className="p-label">Anel</div>
                    <select className="p-select" value={transferForm.AnelEsquerdo} onChange={(e) => setTransferField('AnelEsquerdo', e.target.value)}>
                      <option value="">Selecionar</option>
                      {catalogs.aneis.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="p-field">
                    <div className="p-label">Registro FOB</div>
                    <input className="p-input" style={{ color: 'var(--text-soft)' }} value={transferForm.RegistroFOB} readOnly />
                  </div>
                </div>

                <div className="p-field mb-2">
                  <div className="p-label">Observações</div>
                  <textarea className="p-textarea" style={{ minHeight: 60, resize: 'vertical' }} value={transferForm.observacao} onChange={(e) => setTransferField('observacao', e.target.value)} />
                </div>

                <div className="flex gap-1">
                  <button className="p-btn p-btn--primary" onClick={handleTransferToPlantel}>Enviar ao Plantel</button>
                  <button className="p-btn p-btn--secondary" onClick={cancelTransfer}>Cancelar</button>
                </div>
              </div>

            ) : editMode ? (
              /* ── Formulário de edição ──────────────────────────────────── */
              <div>
                <div className="text-accent" style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Editar Filhote
                </div>

                <div className="p-field mb-2">
                  <div className="p-label">Nome da ave</div>
                  <input className="p-input" value={editForm.NomeAve} onChange={e => setEditForm(f => ({ ...f, NomeAve: e.target.value }))} placeholder="Nome do filhote" />
                </div>

                <div className="p-form-grid">
                  <div className="p-field">
                    <div className="p-label">Condição atual</div>
                    <select className="p-select" value={editForm.Status} onChange={e => setEditForm(f => ({ ...f, Status: e.target.value }))}>
                      {STATUS_FILHOTE.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="p-field">
                    <div className="p-label">Gênero</div>
                    <select className="p-select" value={editForm.Genero} onChange={e => setEditForm(f => ({ ...f, Genero: e.target.value }))}>
                      <option value="">Indefinido</option>
                      <option value="Macho">Macho</option>
                      <option value="Femea">Fêmea</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-1 mt-3">
                  <button className="p-btn p-btn--primary" onClick={saveEdit}>Salvar</button>
                  <button className="p-btn p-btn--secondary" onClick={cancelEdit}>Cancelar</button>
                  <button className="p-btn p-btn--danger" onClick={() => { setDeathTarget(selectedFilhote); cancelEdit() }}>Sinalizar óbito</button>
                </div>
              </div>

            ) : (
              /* ── Visualização dos dados ────────────────────────────────── */
              <>
                <div className="mb-2">
                  <div className="text-accent" style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Informações dos Pais
                  </div>
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Mãe</div>
                      <div className="p-input" style={readonlyInputStyle}>{selectedFilhote.NomeMae || '---'}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Mutação Mãe</div>
                      <div className="p-input" style={readonlyInputStyle}>{selectedFilhote.MutacaoMae || '---'}</div>
                    </div>
                  </div>
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Pai</div>
                      <div className="p-input" style={readonlyInputStyle}>{selectedFilhote.NomePai || '---'}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Mutação Pai</div>
                      <div className="p-input" style={readonlyInputStyle}>{selectedFilhote.MutacaoPai || '---'}</div>
                    </div>
                  </div>
                </div>

                <hr className="p-divider" />

                <div className="mb-2">
                  <div className="text-accent" style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dados do Filhote
                  </div>
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Nome</div>
                      <div className="text-main">{selectedFilhote.NomeAve || '(sem nome)'}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Status</div>
                      <StatusBadge status={selectedFilhote.Status} />
                    </div>
                  </div>
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Gaiola</div>
                      <div className="p-input" style={readonlyInputStyle}>{selectedFilhote.Gaiola || '---'}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Ovo</div>
                      <div className="p-input" style={readonlyInputStyle}>#{selectedFilhote.NumeroOvo}</div>
                    </div>
                  </div>
                  <div className="p-form-grid">
                    <div className="p-field">
                      <div className="p-label">Nascimento</div>
                      <div className="p-input" style={readonlyInputStyle}>{fmtDate(toIsoDate(selectedFilhote.DataNascimento) || selectedFilhote.DataNascimento)}</div>
                    </div>
                    <div className="p-field">
                      <div className="p-label">Prev. Anilhamento</div>
                      <div className="p-input" style={readonlyInputStyle}>{fmtDate(toIsoDate(selectedFilhote.DataPrevistaAnilhamento) || selectedFilhote.DataPrevistaAnilhamento)}</div>
                    </div>
                  </div>
                  {selectedFilhote.Genero && (
                    <div className="p-field">
                      <div className="p-label">Gênero</div>
                      <div className="text-main">{selectedFilhote.Genero}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Previsão genética ────────────────────────────── */}
        <div className="module-panel flex flex-col" style={{ overflow: 'hidden' }}>
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Previsão Genética</div>
              <div className="p-panel-header__subtitle">Mutações possíveis dos filhotes</div>
            </div>
          </div>
          <div className="p-panel-body">
            {!selectedFilhote ? (
              <div className="module-empty">Selecione um filhote para ver a previsão.</div>
            ) : !crossing ? (
              <div className="module-empty">
                <div style={{ fontSize: 28, marginBottom: 8 }}>&#x1F9EC;</div>
                {selectedFilhote.MutacaoPai && selectedFilhote.MutacaoMae
                  ? `Cruzamento ${selectedFilhote.MutacaoPai} × ${selectedFilhote.MutacaoMae} não cadastrado no simulador.`
                  : 'Mutações dos pais não informadas para este filhote.'}
              </div>
            ) : (
              <>
                <div className="p-list-item mb-2" style={{ cursor: 'default' }}>
                  <div className="p-label">Cruzamento</div>
                  <div className="text-main" style={{ fontSize: 13, lineHeight: 1.8 }}>
                    Espécie: {selectedFilhote.CategoriaAve || transferForm.CategoriaAve}
                    <br />
                    Pai: {selectedFilhote.MutacaoPai}
                    <br />
                    Mãe: {selectedFilhote.MutacaoMae}
                  </div>
                </div>

                {crossing.isCrossingOver ? (
                  <>
                    <div style={{ fontSize: 10, color: '#B39DDB', marginBottom: 4, fontWeight: 600 }}>Resultado Normal:</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#8a7e74', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>♀ Fêmeas</div>
                        {crossing.resultadoNormal.femeas.map((r, i) => <MiniMutBadge key={i} name={r.mutacao} percentual={r.percentual} />)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#8a7e74', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>♂ Machos</div>
                        {crossing.resultadoNormal.machos.map((r, i) => <MiniMutBadge key={i} name={r.mutacao} percentual={r.percentual} />)}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#FF9800', marginBottom: 4, fontWeight: 600 }}>Crossing-Over:</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#8a7e74', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>♀ Fêmeas</div>
                        {crossing.resultadoCrossOver.femeas.map((r, i) => <MiniMutBadge key={i} name={r.mutacao} percentual={r.percentual} />)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#8a7e74', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>♂ Machos</div>
                        {crossing.resultadoCrossOver.machos.map((r, i) => <MiniMutBadge key={i} name={r.mutacao} percentual={r.percentual} />)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#8a7e74', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>♀ Fêmeas</div>
                      {crossing.resultadoFemeas.map((r, i) => <MiniMutBadge key={i} name={r.mutacao} percentual={r.percentual} />)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#8a7e74', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>♂ Machos</div>
                      {crossing.resultadoMachos.map((r, i) => <MiniMutBadge key={i} name={r.mutacao} percentual={r.percentual} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {deathTarget ? (
        <ConfirmModal
          title="Registrar óbito do filhote?"
          message={`O filhote "${deathTarget.NomeAve || `Ovo #${deathTarget.NumeroOvo}`}" será marcado como falecido e removido da lista.`}
          confirmLabel="Confirmar óbito"
          danger
          onConfirm={handleMarkDeath}
          onCancel={() => setDeathTarget(null)}
        />
      ) : null}
    </div>
  )
}
