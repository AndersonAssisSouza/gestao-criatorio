import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { GaiolasTable }  from './GaiolasTable'
import { GaiolasForm }   from './GaiolasForm'
import { GaiolasDetail } from './GaiolasDetail'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK = [
  { id: 1,  codigo: 'G-01', tipo: 'Reprodução', localizacao: 'Sala A - Prateleira 1', capacidade: 2,  ocupacao: 2, avesResidentes: 'Canário Ouro, Tarim Isabela',     status: 'Ocupada',      ultimaLimpeza: '2026-03-28', observacoes: 'Casal em período reprodutivo' },
  { id: 2,  codigo: 'G-02', tipo: 'Voo',        localizacao: 'Sala A - Prateleira 2', capacidade: 6,  ocupacao: 3, avesResidentes: 'Pintassilgo Verde, Canário Bronze, Tarim Ágata', status: 'Ocupada', ultimaLimpeza: '2026-04-01', observacoes: '' },
  { id: 3,  codigo: 'G-03', tipo: 'Exposição',  localizacao: 'Sala B - Bancada 1',    capacidade: 1,  ocupacao: 1, avesResidentes: 'Canário Mosaico',                 status: 'Ocupada',      ultimaLimpeza: '2026-04-03', observacoes: 'Preparação para torneio' },
  { id: 4,  codigo: 'G-04', tipo: 'Choco',      localizacao: 'Sala A - Prateleira 3', capacidade: 2,  ocupacao: 1, avesResidentes: 'Pintassilgo Âmbar',                status: 'Ocupada',      ultimaLimpeza: '2026-03-25', observacoes: 'Ninho com 3 ovos' },
  { id: 5,  codigo: 'G-05', tipo: 'Reprodução', localizacao: 'Sala A - Prateleira 1', capacidade: 2,  ocupacao: 0, avesResidentes: '',                                  status: 'Disponível',   ultimaLimpeza: '2026-04-02', observacoes: '' },
  { id: 6,  codigo: 'G-06', tipo: 'Voo',        localizacao: 'Sala B - Bancada 2',    capacidade: 8,  ocupacao: 0, avesResidentes: '',                                  status: 'Manutenção',   ultimaLimpeza: '2026-03-15', observacoes: 'Porta danificada, aguardando reparo' },
  { id: 7,  codigo: 'G-07', tipo: 'Exposição',  localizacao: 'Sala B - Bancada 1',    capacidade: 1,  ocupacao: 0, avesResidentes: '',                                  status: 'Disponível',   ultimaLimpeza: '2026-04-04', observacoes: '' },
  { id: 8,  codigo: 'G-08', tipo: 'Choco',      localizacao: 'Sala A - Prateleira 3', capacidade: 2,  ocupacao: 0, avesResidentes: '',                                  status: 'Disponível',   ultimaLimpeza: '2026-04-01', observacoes: '' },
  { id: 9,  codigo: 'G-09', tipo: 'Voo',        localizacao: 'Sala C - Viveiro 1',    capacidade: 12, ocupacao: 5, avesResidentes: 'Coleiro Sol, Coleiro Lua, Canário Prata, Canário Rubi, Tarim Neve', status: 'Ocupada', ultimaLimpeza: '2026-03-30', observacoes: 'Viveiro grande externo' },
  { id: 10, codigo: 'G-10', tipo: 'Reprodução', localizacao: 'Sala C - Viveiro 2',    capacidade: 2,  ocupacao: 0, avesResidentes: '',                                  status: 'Manutenção',   ultimaLimpeza: '2026-03-10', observacoes: 'Comedouro quebrado' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function GaiolasModule() {
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
          // const res = await gaiolasService.listar()
          // setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar gaiolas.')
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
          // const res = await gaiolasService.criar(form)
          // setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // const res = await gaiolasService.atualizar(modal.edit.id, form)
          // setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      // if (!USE_MOCK) await gaiolasService.remover(delTarget.id)
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.codigo, r.tipo, r.localizacao, r.status, r.avesResidentes]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const stats = {
    total:       data.length,
    ocupadas:    data.filter(r => r.status === 'Ocupada').length,
    disponiveis: data.filter(r => r.status === 'Disponível').length,
    manutencao:  data.filter(r => r.status === 'Manutenção').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando gaiolas...
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
        <StatCard label="Total Gaiolas"  value={stats.total}       desc="gaiolas cadastradas"    color="#D4A017" />
        <StatCard label="Ocupadas"       value={stats.ocupadas}    desc="com aves residentes"    color="#F5A623" />
        <StatCard label="Disponíveis"    value={stats.disponiveis} desc="prontas para uso"       color="#4CAF7D" />
        <StatCard label="Em Manutenção"  value={stats.manutencao}  desc="aguardando reparo"      color="#8A9E8C" />
      </div>

      {/* Detalhe */}
      {selected && (
        <GaiolasDetail
          gaiola={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModal({ edit: selected }); setSelected(null) }}
        />
      )}

      {/* Tabela */}
      <div style={{ background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Gaiolas</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 200 }}
              placeholder="Buscar gaiola..."
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhuma gaiola encontrada</div>
          </div>
        ) : (
          <GaiolasTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <GaiolasForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <GaiolasForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover gaiola?"
          message={`A gaiola "${delTarget.codigo}" será removida. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
