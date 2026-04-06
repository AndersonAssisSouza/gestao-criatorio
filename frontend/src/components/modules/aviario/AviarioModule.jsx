import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { AviarioTable }  from './AviarioTable'
import { AviarioForm }   from './AviarioForm'
import { AviarioDetail } from './AviarioDetail'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK = [
  { id: 1, nome: 'Sala A',       tipo: 'Sala Interna',    area: 18,  capacidadeGaiolas: 40, gaiolasInstaladas: 35, temperatura: 24, umidade: 65, iluminacao: 'Artificial', status: 'Ativo',   ultimaManutencao: '2026-03-20', observacoes: 'Climatização controlada' },
  { id: 2, nome: 'Viveiro 1',    tipo: 'Viveiro Externo',  area: 45,  capacidadeGaiolas: 20, gaiolasInstaladas: 18, temperatura: 28, umidade: 72, iluminacao: 'Natural',    status: 'Ativo',   ultimaManutencao: '2026-03-15', observacoes: 'Cobertura parcial com sombrite' },
  { id: 3, nome: 'Quarentena 1', tipo: 'Quarentena',       area: 8,   capacidadeGaiolas: 10, gaiolasInstaladas: 4,  temperatura: 25, umidade: 60, iluminacao: 'Artificial', status: 'Ativo',   ultimaManutencao: '2026-04-01', observacoes: 'Uso restrito para aves em observacao' },
  { id: 4, nome: 'Sala B',       tipo: 'Sala Interna',    area: 22,  capacidadeGaiolas: 50, gaiolasInstaladas: 42, temperatura: 23, umidade: 63, iluminacao: 'Mista',      status: 'Ativo',   ultimaManutencao: '2026-03-28', observacoes: 'Ventilacao cruzada + lampadas' },
  { id: 5, nome: 'Viveiro 2',    tipo: 'Viveiro Externo',  area: 60,  capacidadeGaiolas: 30, gaiolasInstaladas: 0,  temperatura: 27, umidade: 70, iluminacao: 'Natural',    status: 'Reforma', ultimaManutencao: '2026-02-10', observacoes: 'Tela danificada, reforma em andamento' },
  { id: 6, nome: 'Sala C',       tipo: 'Sala Interna',    area: 15,  capacidadeGaiolas: 30, gaiolasInstaladas: 28, temperatura: 24, umidade: 64, iluminacao: 'Artificial', status: 'Inativo', ultimaManutencao: '2026-01-20', observacoes: 'Desativada temporariamente' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function AviarioModule() {
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
          // const res = await aviarioService.listar()
          // setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar aviarios.')
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
          // const res = await aviarioService.criar(form)
          // setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // const res = await aviarioService.atualizar(modal.edit.id, form)
          // setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      // if (!USE_MOCK) await aviarioService.remover(delTarget.id)
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.nome, r.tipo, r.status, r.iluminacao, r.observacoes]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const stats = {
    total:            data.length,
    gaiolasInst:      data.reduce((s, r) => s + (Number(r.gaiolasInstaladas) || 0), 0),
    capacidadeTotal:  data.reduce((s, r) => s + (Number(r.capacidadeGaiolas) || 0), 0),
    emReforma:        data.filter(r => r.status === 'Reforma').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando aviarios...
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
        <StatCard label="Total Espacos"       value={stats.total}           desc="espacos cadastrados"      color="#D4A017" />
        <StatCard label="Gaiolas Instaladas"   value={stats.gaiolasInst}     desc="gaiolas em uso"            color="#F5A623" />
        <StatCard label="Capacidade Total"     value={stats.capacidadeTotal} desc="gaiolas suportadas"        color="#4CAF7D" />
        <StatCard label="Em Reforma"           value={stats.emReforma}       desc="espacos em reforma"        color="#8A9E8C" />
      </div>

      {/* Detalhe */}
      {selected && (
        <AviarioDetail
          aviario={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModal({ edit: selected }); setSelected(null) }}
        />
      )}

      {/* Tabela */}
      <div style={{ background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Aviario</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 200 }}
              placeholder="Buscar espaco..."
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
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhum espaco encontrado</div>
          </div>
        ) : (
          <AviarioTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <AviarioForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <AviarioForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover espaco?"
          message={`O espaco "${delTarget.nome}" sera removido. Esta acao nao pode ser desfeita.`}
          confirmLabel="Confirmar Remocao"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
