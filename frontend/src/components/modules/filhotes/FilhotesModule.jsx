import { useState, useEffect, useMemo } from 'react'
import { StatCard }    from '../../shared/StatCard'
import { StatusBadge } from '../../shared/StatusBadge'

// ─── MOCK DATA — remover quando backend estiver conectado ───────────────────
const MOCK_FILHOTES = [
  { ID: 1, NomeAve: '',            NumeroOvo: '3', Status: 'Vivo', DataNascimento: '2026-03-31', DataPrevistaAnilhamento: '2026-04-05', Gaiola: 'G-01', IDMae: 2, IDPai: 1, NomeMae: 'Athena', MutacaoMae: 'Canela',    NomePai: 'Thor',   MutacaoPai: 'Ancestral' },
  { ID: 2, NomeAve: 'Filhote-02', NumeroOvo: '2', Status: 'Vivo', DataNascimento: '2026-04-03', DataPrevistaAnilhamento: '2026-04-08', Gaiola: 'G-01', IDMae: 2, IDPai: 1, NomeMae: 'Athena', MutacaoMae: 'Canela',    NomePai: 'Thor',   MutacaoPai: 'Ancestral' },
]

// ─── Mutation Lookup (MutacaoTarin simplified) ──────────────────────────────
const MUTATION_RESULTS = {
  'Tarin': {
    'Ancestral|Canela': {
      machos:  ['Ancestral /canela', 'Ancestral /canela'],
      femeas:  ['Canela', 'Ancestral'],
    },
    'Pastel|Canela Pastel': {
      machos:  ['Pastel /canela', 'Pastel /canela'],
      femeas:  ['Canela Pastel', 'Pastel'],
    },
    'Ancestral|Ancestral': {
      machos:  ['Ancestral', 'Ancestral'],
      femeas:  ['Ancestral', 'Ancestral'],
    },
    'Pastel|Canela': {
      machos:  ['Ancestral /canela /pastel', 'Ancestral /canela /pastel'],
      femeas:  ['Pastel', 'Canela', 'Canela Pastel', 'Ancestral'],
    },
    'Canela|Canela': {
      machos:  ['Canela', 'Canela'],
      femeas:  ['Canela', 'Canela'],
    },
  },
}

const ESPECIES = ['Tarin', 'Canario', 'Pintassilgo']
const MUTACOES_TARIN = ['Ancestral', 'Canela', 'Pastel', 'Canela Pastel', 'Agata', 'Satine', 'Isabel']

const STATUS_OPTIONS = ['Vivo', 'Faleceu', 'Plantel']

// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  container:    { display: 'flex', gap: 16, minHeight: 'calc(100vh - 200px)' },
  panel:        { background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  panelHeader:  { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle:   { fontSize: 15, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" },
  panelSub:     { fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 },
  panelBody:    { padding: '12px 16px', flex: 1, overflowY: 'auto' },
  card:         { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s' },
  cardSelected: { background: 'rgba(201,80,37,0.1)', border: '1px solid rgba(201,80,37,0.3)' },
  label:        { fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 },
  value:        { fontSize: 13, color: '#F2EDE4', fontFamily: "'DM Mono', monospace" },
  valueMuted:   { fontSize: 12, color: '#8A9E8C', fontFamily: "'DM Mono', monospace" },
  valueReadonly:{ fontSize: 13, color: '#8A9E8C', fontFamily: "'DM Mono', monospace", background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px' },
  row:          { display: 'flex', gap: 12, marginBottom: 8 },
  col:          { flex: 1 },
  btn:          { background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#F2EDE4', fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  btnSecondary: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', color: '#F2EDE4', fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace", cursor: 'pointer' },
  select:       { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', appearance: 'none' },
  input:        { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box' },
  divider:      { height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' },
  resultCard:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', marginBottom: 6 },
}

const fmtDate = (d) => {
  if (!d) return '---'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('pt-BR')
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MODULE
// ═════════════════════════════════════════════════════════════════════════════
export function FilhotesModule() {
  const [filhotes, setFilhotes]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [selectedFilhote, setSelectedFilhote] = useState(null)
  const [editMode, setEditMode]           = useState(false)
  const [editForm, setEditForm]           = useState({})

  // Mutation prediction state
  const [predEspecie, setPredEspecie]       = useState('Tarin')
  const [predMutMacho, setPredMutMacho]     = useState('')
  const [predMutFemea, setPredMutFemea]     = useState('')

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => {
      setFilhotes(MOCK_FILHOTES)
      setLoading(false)
    }, 400)
  }, [])

  // ─── Select first chick on load ──────────────────────────────────────────
  useEffect(() => {
    if (filhotes.length > 0 && !selectedFilhote) {
      setSelectedFilhote(filhotes[0])
    }
  }, [filhotes, selectedFilhote])

  // ─── Start editing ────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!selectedFilhote) return
    setEditForm({
      NomeAve: selectedFilhote.NomeAve || '',
      Status:  selectedFilhote.Status || 'Vivo',
    })
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditForm({})
  }

  const saveEdit = () => {
    if (!selectedFilhote) return
    const updated = { ...selectedFilhote, ...editForm }
    setFilhotes(prev => prev.map(f => f.ID === selectedFilhote.ID ? updated : f))
    setSelectedFilhote(updated)
    setEditMode(false)
    setEditForm({})
  }

  // ─── Mutation Prediction ──────────────────────────────────────────────────
  const predictionResults = useMemo(() => {
    if (!predMutMacho || !predMutFemea || !predEspecie) return null
    const specieData = MUTATION_RESULTS[predEspecie]
    if (!specieData) return null
    const key = `${predMutMacho}|${predMutFemea}`
    const reverseKey = `${predMutFemea}|${predMutMacho}`
    return specieData[key] || specieData[reverseKey] || null
  }, [predEspecie, predMutMacho, predMutFemea])

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total:    filhotes.length,
    vivos:    filhotes.filter(f => f.Status === 'Vivo').length,
    plantel:  filhotes.filter(f => f.Status === 'Plantel').length,
    faleceu:  filhotes.filter(f => f.Status === 'Faleceu').length,
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando filhotes...
    </div>
  )

  return (
    <div>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Filhotes"  value={stats.total}   desc="filhotes registrados" color="#5BC0EB" />
        <StatCard label="Vivos"           value={stats.vivos}   desc="filhotes vivos"       color="#4CAF7D" />
        <StatCard label="Plantel"         value={stats.plantel} desc="enviados ao plantel"   color="#C95025" />
        <StatCard label="Falecidos"       value={stats.faleceu} desc="obitos registrados"    color="#E05C4B" />
      </div>

      {/* 3-Panel Layout */}
      <div style={S.container}>

        {/* ─── LEFT PANEL: Chicks Gallery ────────────────────────────────── */}
        <div style={{ ...S.panel, flex: '0 0 260px' }}>
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
                onClick={() => { setSelectedFilhote(f); setEditMode(false) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>
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
              <div style={{ textAlign: 'center', padding: '40px 12px', color: '#3A5C3C', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                Nenhum filhote registrado
              </div>
            )}
          </div>
        </div>

        {/* ─── MIDDLE PANEL: Chick Detail Form ──────────────────────────── */}
        <div style={{ ...S.panel, flex: '1 1 340px' }}>
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
              <button style={S.btn} onClick={startEdit}>Editar</button>
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
              <div style={{ textAlign: 'center', padding: '40px 12px', color: '#3A5C3C', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                Selecione um filhote para ver os detalhes
              </div>
            ) : (
              <>
                {/* Parent Info (read-only) */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: "'DM Mono', monospace", marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C95025', fontFamily: "'DM Mono', monospace", marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                      <div style={S.valueReadonly}>{fmtDate(selectedFilhote.DataNascimento)}</div>
                    </div>
                    <div style={S.col}>
                      <div style={S.label}>Prev. Anilhamento</div>
                      <div style={S.valueReadonly}>{fmtDate(selectedFilhote.DataPrevistaAnilhamento)}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Mutation Prediction ──────────────────────────── */}
        <div style={{ ...S.panel, flex: '1 1 300px' }}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelTitle}>Previsao de Mutacao</div>
              <div style={S.panelSub}>Simulador genetico</div>
            </div>
          </div>
          <div style={S.panelBody}>
            {/* Especie */}
            <div style={{ marginBottom: 14 }}>
              <div style={S.label}>Especie</div>
              <select
                style={S.select}
                value={predEspecie}
                onChange={e => { setPredEspecie(e.target.value); setPredMutMacho(''); setPredMutFemea('') }}
              >
                {ESPECIES.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {/* Mutacao Macho */}
            <div style={{ marginBottom: 14 }}>
              <div style={S.label}>Mutacao Macho</div>
              <select
                style={S.select}
                value={predMutMacho}
                onChange={e => setPredMutMacho(e.target.value)}
              >
                <option value="">-- Selecione --</option>
                {MUTACOES_TARIN.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Mutacao Femea */}
            <div style={{ marginBottom: 14 }}>
              <div style={S.label}>Mutacao Femea</div>
              <select
                style={S.select}
                value={predMutFemea}
                onChange={e => setPredMutFemea(e.target.value)}
              >
                <option value="">-- Selecione --</option>
                {MUTACOES_TARIN.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={S.divider} />

            {/* Results */}
            {!predMutMacho || !predMutFemea ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#3A5C3C', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                Selecione as mutacoes do macho e da femea para ver a previsao
              </div>
            ) : !predictionResults ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#4A6A4C', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>&#x1F9EC;</div>
                Combinacao nao encontrada na tabela de mutacoes.
                <br />
                Cadastre no modulo de Mutacoes para habilitar.
              </div>
            ) : (
              <>
                {/* Filhotes Machos */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#5BC0EB', fontFamily: "'DM Mono', monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Filhotes Machos
                  </div>
                  {predictionResults.machos.map((mut, i) => (
                    <div key={i} style={S.resultCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5BC0EB', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#F2EDE4', fontFamily: "'DM Mono', monospace" }}>{mut}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filhotes Femeas */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E88DB4', fontFamily: "'DM Mono', monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Filhotes Femeas
                  </div>
                  {predictionResults.femeas.map((mut, i) => (
                    <div key={i} style={S.resultCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E88DB4', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#F2EDE4', fontFamily: "'DM Mono', monospace" }}>{mut}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
