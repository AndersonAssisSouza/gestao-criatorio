import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { ChocandoTable }  from './ChocandoTable'
import { ChocandoForm }   from './ChocandoForm'
import { ChocandoDetail } from './ChocandoDetail'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK = [
  { id: 1, aveNome: 'Tarim Isabela',      categoriaAve: 'Tarim',       gaiola: 'G-05', dataInicio: '2026-03-10', previsaoEclosao: '2026-03-24', quantidadeOvos: 4, ovosFerteis: 3, status: 'Em Choco',   observacoes: 'Primeira ninhada da temporada' },
  { id: 2, aveNome: 'Pintassilgo Âmbar',  categoriaAve: 'Pintassilgo', gaiola: 'G-04', dataInicio: '2026-03-15', previsaoEclosao: '2026-03-29', quantidadeOvos: 3, ovosFerteis: 2, status: 'Em Choco',   observacoes: 'Ovos verificados por ovoscopia' },
  { id: 3, aveNome: 'Canário Ouro',       categoriaAve: 'Canário',     gaiola: 'G-01', dataInicio: '2026-02-20', previsaoEclosao: '2026-03-06', quantidadeOvos: 5, ovosFerteis: 4, status: 'Eclodido',   observacoes: '4 filhotes saudáveis' },
  { id: 4, aveNome: 'Tarim Ágata',        categoriaAve: 'Tarim',       gaiola: 'G-07', dataInicio: '2026-03-22', previsaoEclosao: '2026-04-05', quantidadeOvos: 3, ovosFerteis: 3, status: 'Em Choco',   observacoes: 'Todos os ovos férteis' },
  { id: 5, aveNome: 'Canário Mosaico',    categoriaAve: 'Canário',     gaiola: 'G-03', dataInicio: '2026-02-10', previsaoEclosao: '2026-02-24', quantidadeOvos: 4, ovosFerteis: 1, status: 'Abandonado', observacoes: 'Fêmea abandonou o ninho no 8o dia' },
  { id: 6, aveNome: 'Pintassilgo Verde',  categoriaAve: 'Pintassilgo', gaiola: 'G-02', dataInicio: '2026-03-28', previsaoEclosao: '2026-04-11', quantidadeOvos: 3, ovosFerteis: 2, status: 'Em Choco',   observacoes: 'Segunda postura da fêmea' },
  { id: 7, aveNome: 'Canário Bronze',     categoriaAve: 'Canário',     gaiola: 'G-09', dataInicio: '2026-03-01', previsaoEclosao: '2026-03-15', quantidadeOvos: 5, ovosFerteis: 5, status: 'Eclodido',   observacoes: '5 filhotes, todos anilhados' },
  { id: 8, aveNome: 'Tarim Pastel',       categoriaAve: 'Tarim',       gaiola: 'G-11', dataInicio: '2026-04-01', previsaoEclosao: '2026-04-15', quantidadeOvos: 4, ovosFerteis: 3, status: 'Em Choco',   observacoes: 'Fêmea calma, bom comportamento' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function ChocandoModule() {
  const [data,     setData]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(null)   // null | 'add' | { edit: record }
  const [delTarget,setDelTarget]= useState(null)
  const [selected, setSelected] = useState(null)
  const [error,    setError]    = useState('')

  // ─── Carregamento inicial ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (USE_MOCK) {
          setTimeout(() => { setData(MOCK); setLoading(false) }, 400)
        } else {
          // const res = await chocandoService.listar()
          // setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar dados de choco.')
        setLoading(false)
      }
    }
    load()
  }, [])

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    try {
      if (modal === 'add') {
        if (USE_MOCK) {
          setData(d => [...d, { ...form, id: Date.now() }])
        } else {
          // const res = await chocandoService.criar(form)
          // setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // const res = await chocandoService.atualizar(modal.edit.id, form)
          // setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      // if (!USE_MOCK) await chocandoService.remover(delTarget.id)
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.aveNome, r.categoriaAve, r.gaiola, r.status]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear  = now.getFullYear()

  const stats = {
    totalChoco:    data.filter(r => r.status === 'Em Choco').length,
    ovosFerteis:   data.reduce((sum, r) => sum + (r.ovosFerteis || 0), 0),
    previstosMes:  data.filter(r => {
      if (!r.previsaoEclosao) return false
      const d = new Date(r.previsaoEclosao)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.status === 'Em Choco'
    }).length,
    eclosoes:      data.filter(r => r.status === 'Eclodido').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando dados de choco...
    </div>
  )

  return (
    <div>
      {error && (
        <div style={{ background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#E05C4B', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total em Choco"      value={stats.totalChoco}   desc="aves chocando"            color="#F5A623" />
        <StatCard label="Ovos Férteis"        value={stats.ovosFerteis}  desc="confirmados por ovoscopia" color="#4CAF7D" />
        <StatCard label="Previstos este Mês"  value={stats.previstosMes} desc="eclosões esperadas"       color="#D4A017" />
        <StatCard label="Eclosões Realizadas" value={stats.eclosoes}     desc="ninhadas concluídas"      color="#8A9E8C" />
      </div>

      {/* Detalhe */}
      {selected && (
        <ChocandoDetail
          registro={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModal({ edit: selected }); setSelected(null) }}
        />
      )}

      {/* Tabela */}
      <div style={{ background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Aves em Choco</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 200 }}
              placeholder="Buscar choco..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => e.target.style.borderColor = 'rgba(212,160,23,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button
              onClick={() => setModal('add')}
              style={{ background: 'linear-gradient(135deg, #D4A017, #B8870F)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#0A1A0C', fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              + Adicionar
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3A5C3C' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🥚</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhum registro encontrado</div>
          </div>
        ) : (
          <ChocandoTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <ChocandoForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <ChocandoForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover registro de choco?"
          message={`O registro de "${delTarget.aveNome}" será removido. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
