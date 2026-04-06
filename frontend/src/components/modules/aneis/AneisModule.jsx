import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { AneisTable }    from './AneisTable'
import { AneisForm }     from './AneisForm'
import { AneisDetail }   from './AneisDetail'

// --- MOCK -- remover quando backend estiver conectado ----------------------------
const MOCK = [
  { id: 1,  codigo: 'AE-001', tipo: 'IBAMA',     diametro: '3.0', cor: 'Azul',     aveAssociada: 'Canario Ouro',       dataColocacao: '2024-02-10', lote: 'Lote 2024-A', status: 'Utilizado',   observacoes: 'Anilha oficial IBAMA' },
  { id: 2,  codigo: 'AE-002', tipo: 'IBAMA',     diametro: '3.0', cor: 'Azul',     aveAssociada: 'Pintassilgo Verde',   dataColocacao: '2024-02-10', lote: 'Lote 2024-A', status: 'Utilizado',   observacoes: '' },
  { id: 3,  codigo: 'AE-003', tipo: 'FOB',       diametro: '2.8', cor: 'Vermelha', aveAssociada: '\u2014',              dataColocacao: '',           lote: 'Lote 2024-A', status: 'Disponivel',  observacoes: '' },
  { id: 4,  codigo: 'AE-004', tipo: 'Criadouro', diametro: '3.2', cor: 'Verde',    aveAssociada: 'Tarim Isabela',       dataColocacao: '2024-03-15', lote: 'Lote 2024-B', status: 'Utilizado',   observacoes: 'Anilha interna do criadouro' },
  { id: 5,  codigo: 'AE-005', tipo: 'IBAMA',     diametro: '3.0', cor: 'Azul',     aveAssociada: '\u2014',              dataColocacao: '',           lote: 'Lote 2024-A', status: 'Disponivel',  observacoes: '' },
  { id: 6,  codigo: 'AE-006', tipo: 'FOB',       diametro: '2.8', cor: 'Amarela',  aveAssociada: 'Coleiro Sol',         dataColocacao: '2024-05-20', lote: 'Lote 2024-B', status: 'Utilizado',   observacoes: 'Anel de aluminio' },
  { id: 7,  codigo: 'AE-007', tipo: 'IBAMA',     diametro: '3.0', cor: 'Azul',     aveAssociada: '\u2014',              dataColocacao: '',           lote: 'Lote 2024-C', status: 'Extraviado',  observacoes: 'Perdido durante manejo' },
  { id: 8,  codigo: 'AE-008', tipo: 'Criadouro', diametro: '3.5', cor: 'Preta',    aveAssociada: 'Canario Mosaico',     dataColocacao: '2024-06-01', lote: 'Lote 2024-B', status: 'Utilizado',   observacoes: '' },
  { id: 9,  codigo: 'AE-009', tipo: 'FOB',       diametro: '2.8', cor: 'Vermelha', aveAssociada: '\u2014',              dataColocacao: '',           lote: 'Lote 2024-C', status: 'Disponivel',  observacoes: '' },
  { id: 10, codigo: 'AE-010', tipo: 'IBAMA',     diametro: '3.0', cor: 'Azul',     aveAssociada: 'Canario Prata',       dataColocacao: '2024-07-12', lote: 'Lote 2024-C', status: 'Utilizado',   observacoes: 'Transferencia de plantel' },
]

const USE_MOCK = true // <-- mudar para false quando backend estiver pronto

export function AneisModule() {
  const [data,     setData]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(null)   // null | 'add' | { edit: record }
  const [delTarget,setDelTarget]= useState(null)
  const [selected, setSelected] = useState(null)
  const [error,    setError]    = useState('')

  // --- Carregamento inicial --------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (USE_MOCK) {
          setTimeout(() => { setData(MOCK); setLoading(false) }, 400)
        } else {
          // const res = await aneisService.listar()
          // setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar aneis.')
        setLoading(false)
      }
    }
    load()
  }, [])

  // --- CRUD ------------------------------------------------------------------
  const handleSave = async (form) => {
    try {
      if (modal === 'add') {
        if (USE_MOCK) {
          setData(d => [...d, { ...form, id: Date.now() }])
        } else {
          // const res = await aneisService.criar(form)
          // setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // const res = await aneisService.atualizar(modal.edit.id, form)
          // setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      // if (!USE_MOCK) await aneisService.remover(delTarget.id)
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // --- Filtro ----------------------------------------------------------------
  const filtered = data.filter(r =>
    [r.codigo, r.tipo, r.cor, r.aveAssociada, r.lote, r.status]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const stats = {
    total:       data.length,
    utilizados:  data.filter(r => r.status === 'Utilizado').length,
    disponiveis: data.filter(r => r.status === 'Disponivel').length,
    extraviados: data.filter(r => r.status === 'Extraviado').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando aneis...
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
        <StatCard label="Total Aneis"   value={stats.total}       desc="aneis cadastrados"       color="#D4A017" />
        <StatCard label="Utilizados"    value={stats.utilizados}  desc="colocados em aves"       color="#F5A623" />
        <StatCard label="Disponiveis"   value={stats.disponiveis} desc="prontos para uso"        color="#4CAF7D" />
        <StatCard label="Extraviados"   value={stats.extraviados} desc="perdidos ou danificados"  color="#E05C4B" />
      </div>

      {/* Detalhe */}
      {selected && (
        <AneisDetail
          anel={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModal({ edit: selected }); setSelected(null) }}
        />
      )}

      {/* Tabela */}
      <div style={{ background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Aneis</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 200 }}
              placeholder="Buscar anel..."
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#11044;</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhum anel encontrado</div>
          </div>
        ) : (
          <AneisTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <AneisForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <AneisForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover anel?"
          message={`O anel "${delTarget.codigo}" sera removido. Esta acao nao pode ser desfeita.`}
          confirmLabel="Confirmar Remocao"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
