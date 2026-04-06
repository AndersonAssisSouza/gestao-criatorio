import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { PlantelTable }  from './PlantelTable'
import { PlantelForm }   from './PlantelForm'
import { PlantelDetail } from './PlantelDetail'
import { plantelService } from '../../../services/plantel.service'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK = [
  { id: 1, nome: 'Canário Ouro',      status: 'Ativo',     nomeMae: 'Mimi',   nomePai: 'Rex',   gaiola: 'G-01', dataNascimento: '2024-03-12', categoriaAve: 'Canário',      genero: 'Macho',  origem: 'Nascido no criatório', registroFOB: 'FOB-2024-001', anelEsquerdo: 'AE-001' },
  { id: 2, nome: 'Pintassilgo Verde', status: 'Ativo',     nomeMae: 'Flora',  nomePai: 'Bolt',  gaiola: 'G-02', dataNascimento: '2023-11-08', categoriaAve: 'Pintassilgo',  genero: 'Fêmea',  origem: 'Adquirida',            registroFOB: 'FOB-2023-047', anelEsquerdo: 'AE-002' },
  { id: 3, nome: 'Tarim Isabela',     status: 'Chocando',  nomeMae: 'Luna',   nomePai: 'Titan', gaiola: 'G-05', dataNascimento: '2023-06-20', categoriaAve: 'Tarim',        genero: 'Fêmea',  origem: 'Nascido no criatório', registroFOB: 'FOB-2023-021', anelEsquerdo: 'AE-003' },
  { id: 4, nome: 'Canário Bronze',    status: 'Ativo',     nomeMae: 'Mimi',   nomePai: 'Atlas', gaiola: 'G-01', dataNascimento: '2024-01-15', categoriaAve: 'Canário',      genero: 'Macho',  origem: 'Nascido no criatório', registroFOB: 'FOB-2024-008', anelEsquerdo: 'AE-004' },
  { id: 5, nome: 'Pintassilgo Limão', status: 'Inativo',   nomeMae: 'Serena', nomePai: 'Bolt',  gaiola: '—',    dataNascimento: '2022-09-03', categoriaAve: 'Pintassilgo',  genero: 'Macho',  origem: 'Adquirido',            registroFOB: 'FOB-2022-115', anelEsquerdo: 'AE-005' },
  { id: 6, nome: 'Tarim Ágata',       status: 'Ativo',     nomeMae: 'Coral',  nomePai: 'Titan', gaiola: 'G-07', dataNascimento: '2024-02-28', categoriaAve: 'Tarim',        genero: 'Fêmea',  origem: 'Nascido no criatório', registroFOB: 'FOB-2024-019', anelEsquerdo: 'AE-006' },
  { id: 7, nome: 'Canário Mosaico',   status: 'Ativo',     nomeMae: 'Bianca', nomePai: 'Nero',  gaiola: 'G-03', dataNascimento: '2023-12-01', categoriaAve: 'Canário',      genero: 'Macho',  origem: 'Adquirido',            registroFOB: 'FOB-2023-089', anelEsquerdo: 'AE-007' },
  { id: 8, nome: 'Pintassilgo Âmbar', status: 'Chocando',  nomeMae: 'Flora',  nomePai: 'Zorro', gaiola: 'G-04', dataNascimento: '2023-08-14', categoriaAve: 'Pintassilgo',  genero: 'Fêmea',  origem: 'Nascido no criatório', registroFOB: 'FOB-2023-060', anelEsquerdo: 'AE-008' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function PlantelModule() {
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
          const res = await plantelService.listar()
          setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar plantel.')
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
          const res = await plantelService.criar(form)
          setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          const res = await plantelService.atualizar(modal.edit.id, form)
          setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      if (!USE_MOCK) await plantelService.remover(delTarget.id)
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.nome, r.categoriaAve, r.gaiola, r.status]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const stats = {
    total:    data.length,
    ativos:   data.filter(r => r.status === 'Ativo').length,
    chocando: data.filter(r => r.status === 'Chocando').length,
    inativos: data.filter(r => r.status === 'Inativo').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando plantel...
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
        <StatCard label="Total Plantel" value={stats.total}    desc="aves cadastradas"       color="#D4A017" />
        <StatCard label="Ativas"        value={stats.ativos}   desc="em plena atividade"     color="#4CAF7D" />
        <StatCard label="Chocando"      value={stats.chocando} desc="em período de choco"    color="#F5A623" />
        <StatCard label="Inativas"      value={stats.inativos} desc="fora do ciclo"          color="#8A9E8C" />
      </div>

      {/* Detalhe */}
      {selected && (
        <PlantelDetail
          ave={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModal({ edit: selected }); setSelected(null) }}
        />
      )}

      {/* Tabela */}
      <div style={{ background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Plantel</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 200 }}
              placeholder="Buscar ave..."
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🐦</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhuma ave encontrada</div>
          </div>
        ) : (
          <PlantelTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <PlantelForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <PlantelForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover ave do plantel?"
          message={`A ave "${delTarget.nome}" será removida. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
