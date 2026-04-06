import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { ExPlantelTable }  from './ExPlantelTable'
import { ExPlantelForm }   from './ExPlantelForm'
import { ExPlantelDetail } from './ExPlantelDetail'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK = [
  { id: 1, nome: 'Canário Limão',      categoriaAve: 'Canário',     genero: 'Macho',         motivoSaida: 'Venda',  dataSaida: '2025-08-15', destinatario: 'João Ferreira',    valorVenda: 350,  registroFOB: 'FOB-2023-041', anelEsquerdo: 'AE-101', ultimaGaiola: 'G-03', observacoes: 'Excelente plumagem, comprador recorrente.' },
  { id: 2, nome: 'Pintassilgo Claro',  categoriaAve: 'Pintassilgo', genero: 'Fêmea',         motivoSaida: 'Doação', dataSaida: '2025-09-02', destinatario: 'Criador Amigo SP',  valorVenda: 0,    registroFOB: 'FOB-2022-118', anelEsquerdo: 'AE-102', ultimaGaiola: 'G-07', observacoes: 'Doada para programa de reprodução.' },
  { id: 3, nome: 'Tarim Cobre',        categoriaAve: 'Tarim',       genero: 'Macho',         motivoSaida: 'Óbito',  dataSaida: '2025-10-20', destinatario: '—',                 valorVenda: 0,    registroFOB: 'FOB-2024-005', anelEsquerdo: 'AE-103', ultimaGaiola: 'G-01', observacoes: 'Causa natural, ave idosa.' },
  { id: 4, nome: 'Canário Nevado',     categoriaAve: 'Canário',     genero: 'Fêmea',         motivoSaida: 'Venda',  dataSaida: '2025-11-10', destinatario: 'Maria Lúcia',       valorVenda: 280,  registroFOB: 'FOB-2024-012', anelEsquerdo: 'AE-104', ultimaGaiola: 'G-02', observacoes: 'Venda via indicação.' },
  { id: 5, nome: 'Coleiro Tui-Tui',    categoriaAve: 'Coleiro',     genero: 'Macho',         motivoSaida: 'Fuga',   dataSaida: '2025-12-03', destinatario: '—',                 valorVenda: 0,    registroFOB: 'FOB-2023-077', anelEsquerdo: 'AE-105', ultimaGaiola: 'G-05', observacoes: 'Escapou durante manejo da gaiola.' },
  { id: 6, nome: 'Pintassilgo Ágata',  categoriaAve: 'Pintassilgo', genero: 'Fêmea',         motivoSaida: 'Doação', dataSaida: '2026-01-18', destinatario: 'Assoc. Criadores RJ', valorVenda: 0,  registroFOB: 'FOB-2023-092', anelEsquerdo: 'AE-106', ultimaGaiola: 'G-04', observacoes: 'Doada para exposição regional.' },
  { id: 7, nome: 'Canário Malhado',    categoriaAve: 'Canário',     genero: 'Macho',         motivoSaida: 'Venda',  dataSaida: '2026-02-05', destinatario: 'Pedro Henrique',    valorVenda: 420,  registroFOB: 'FOB-2024-031', anelEsquerdo: 'AE-107', ultimaGaiola: 'G-06', observacoes: 'Campeão de concurso, alto valor.' },
  { id: 8, nome: 'Tarim Pastel',       categoriaAve: 'Tarim',       genero: 'Indeterminado', motivoSaida: 'Óbito',  dataSaida: '2026-03-12', destinatario: '—',                 valorVenda: 0,    registroFOB: 'FOB-2024-044', anelEsquerdo: 'AE-108', ultimaGaiola: 'G-01', observacoes: 'Filhote, causa indeterminada.' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function ExPlantelModule() {
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
          // const res = await exPlantelService.listar()
          // setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar ex-plantel.')
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
          // const res = await exPlantelService.criar(form)
          // setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // const res = await exPlantelService.atualizar(modal.edit.id, form)
          // setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      // if (!USE_MOCK) await exPlantelService.remover(delTarget.id)
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.nome, r.categoriaAve, r.motivoSaida, r.destinatario]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const stats = {
    total:   data.length,
    vendas:  data.filter(r => r.motivoSaida === 'Venda').length,
    doacoes: data.filter(r => r.motivoSaida === 'Doação').length,
    obitos:  data.filter(r => r.motivoSaida === 'Óbito').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando ex-plantel...
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
        <StatCard label="Total Baixas"  value={stats.total}   desc="aves desligadas"         color="#D4A017" />
        <StatCard label="Vendas"        value={stats.vendas}  desc="aves vendidas"            color="#4CAF7D" />
        <StatCard label="Doações"       value={stats.doacoes} desc="aves doadas"              color="#F5A623" />
        <StatCard label="Óbitos"        value={stats.obitos}  desc="falecimentos registrados" color="#8A9E8C" />
      </div>

      {/* Detalhe */}
      {selected && (
        <ExPlantelDetail
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Ex-Plantel</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 200 }}
              placeholder="Buscar registro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => e.target.style.borderColor = 'rgba(212,160,23,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button
              onClick={() => setModal('add')}
              style={{ background: 'linear-gradient(135deg, #D4A017, #B8870F)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#0A1A0C', fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              + Registrar Baixa
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3A5C3C' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhum registro encontrado</div>
          </div>
        ) : (
          <ExPlantelTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <ExPlantelForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <ExPlantelForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover registro de baixa?"
          message={`O registro de "${delTarget.nome}" será removido. Esta ação não pode ser desfeita.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
