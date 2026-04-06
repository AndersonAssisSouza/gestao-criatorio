import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { FilhotesTable }  from './FilhotesTable'
import { FilhotesForm }   from './FilhotesForm'
import { FilhotesDetail } from './FilhotesDetail'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK = [
  { id: 1, nome: 'Filhote C-01',    categoriaAve: 'Canário',     dataNascimento: '2026-02-10', nomeMae: 'Mimi',   nomePai: 'Rex',   gaiola: 'G-01', anelamento: 'AN-2026-001', peso: 18,  status: 'Em Desenvolvimento', destino: '-',       observacoes: 'Desenvolvimento normal, plumagem começando a aparecer' },
  { id: 2, nome: 'Filhote P-01',    categoriaAve: 'Pintassilgo', dataNascimento: '2026-01-22', nomeMae: 'Flora',  nomePai: 'Bolt',  gaiola: 'G-02', anelamento: 'AN-2026-002', peso: 14,  status: 'Desmamado',          destino: 'Plantel', observacoes: 'Desmame completo, alimentação independente' },
  { id: 3, nome: 'Filhote T-01',    categoriaAve: 'Tarim',       dataNascimento: '2026-03-05', nomeMae: 'Luna',   nomePai: 'Titan', gaiola: 'G-05', anelamento: 'AN-2026-003', peso: 8,   status: 'Em Desenvolvimento', destino: '-',       observacoes: 'Recém-nascido, alimentação assistida' },
  { id: 4, nome: 'Filhote C-02',    categoriaAve: 'Canário',     dataNascimento: '2025-11-18', nomeMae: 'Mimi',   nomePai: 'Atlas', gaiola: 'G-01', anelamento: 'AN-2025-048', peso: 22,  status: 'Transferido para Plantel', destino: 'Plantel', observacoes: 'Transferido ao plantel em 2026-01-20' },
  { id: 5, nome: 'Filhote P-02',    categoriaAve: 'Pintassilgo', dataNascimento: '2026-02-28', nomeMae: 'Serena', nomePai: 'Bolt',  gaiola: 'G-04', anelamento: 'AN-2026-004', peso: 10,  status: 'Em Desenvolvimento', destino: '-',       observacoes: 'Crescimento saudável' },
  { id: 6, nome: 'Filhote Col-01',  categoriaAve: 'Coleiro',     dataNascimento: '2026-01-05', nomeMae: 'Jade',   nomePai: 'Nero',  gaiola: 'G-07', anelamento: 'AN-2026-005', peso: 16,  status: 'Desmamado',          destino: 'Venda',   observacoes: 'Pronto para comercialização' },
  { id: 7, nome: 'Filhote T-02',    categoriaAve: 'Tarim',       dataNascimento: '2025-12-12', nomeMae: 'Coral',  nomePai: 'Titan', gaiola: 'G-05', anelamento: 'AN-2025-051', peso: 0,   status: 'Óbito',              destino: '-',       observacoes: 'Óbito em 2026-01-02, causa: fraqueza neonatal' },
  { id: 8, nome: 'Filhote C-03',    categoriaAve: 'Canário',     dataNascimento: '2026-03-15', nomeMae: 'Bianca', nomePai: 'Rex',   gaiola: 'G-03', anelamento: '',            peso: 5,   status: 'Em Desenvolvimento', destino: '-',       observacoes: 'Ainda sem anelamento, muito jovem' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function FilhotesModule() {
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
          // TODO: integrar com filhotesService quando disponível
          setData([])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar filhotes.')
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
          // TODO: integrar com filhotesService.criar(form)
          setData(d => [...d, { ...form, id: Date.now() }])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // TODO: integrar com filhotesService.atualizar(modal.edit.id, form)
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      if (!USE_MOCK) {
        // TODO: integrar com filhotesService.remover(delTarget.id)
      }
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.nome, r.categoriaAve, r.nomeMae, r.nomePai, r.status]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const stats = {
    total:          data.length,
    desenvolvimento:data.filter(r => r.status === 'Em Desenvolvimento').length,
    desmamados:     data.filter(r => r.status === 'Desmamado').length,
    transferidos:   data.filter(r => r.status === 'Transferido para Plantel').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando filhotes...
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
        <StatCard label="Total Filhotes"     value={stats.total}           desc="filhotes cadastrados"    color="#D4A017" />
        <StatCard label="Em Desenvolvimento"  value={stats.desenvolvimento} desc="em fase de crescimento"  color="#5BC0EB" />
        <StatCard label="Desmamados"          value={stats.desmamados}      desc="alimentação independente" color="#4CAF7D" />
        <StatCard label="Transferidos"        value={stats.transferidos}    desc="enviados ao plantel"     color="#F5A623" />
      </div>

      {/* Detalhe */}
      {selected && (
        <FilhotesDetail
          filhote={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModal({ edit: selected }); setSelected(null) }}
        />
      )}

      {/* Tabela */}
      <div style={{ background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Filhotes</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 200 }}
              placeholder="Buscar filhote..."
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🐣</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhum filhote encontrado</div>
          </div>
        ) : (
          <FilhotesTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <FilhotesForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <FilhotesForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover filhote?"
          message={`O filhote "${delTarget.nome}" será removido. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
