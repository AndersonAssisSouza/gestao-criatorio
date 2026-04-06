import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { EspeciesTable }  from './EspeciesTable'
import { EspeciesForm }   from './EspeciesForm'
import { EspeciesDetail } from './EspeciesDetail'

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK = [
  { id: 1, nomeComum: 'Canario-da-terra',    nomeCientifico: 'Sicalis flaveola',       familia: 'Thraupidae',    quantidadePlantel: 12, corPredominante: 'Amarelo',       tamanhoMedio: 13.5, dietaPrincipal: 'Granivora',     statusConservacao: 'Comum',           observacoes: 'Especie mais numerosa do plantel. Boa adaptacao ao cativeiro.' },
  { id: 2, nomeComum: 'Pintassilgo',          nomeCientifico: 'Spinus magellanicus',    familia: 'Fringillidae',  quantidadePlantel: 8,  corPredominante: 'Verde-amarelo', tamanhoMedio: 12.0, dietaPrincipal: 'Granivora',     statusConservacao: 'Comum',           observacoes: 'Canto melodioso. Requer sementes variadas na dieta.' },
  { id: 3, nomeComum: 'Coleiro-baiano',       nomeCientifico: 'Sporophila nigricollis', familia: 'Thraupidae',    quantidadePlantel: 6,  corPredominante: 'Pardo-olivaceo', tamanhoMedio: 11.0, dietaPrincipal: 'Granivora',     statusConservacao: 'Comum',           observacoes: 'Canto forte e variado. Prefere alpiste e painco.' },
  { id: 4, nomeComum: 'Curió',                nomeCientifico: 'Sporophila angolensis',  familia: 'Thraupidae',    quantidadePlantel: 4,  corPredominante: 'Preto-avermelhado', tamanhoMedio: 14.5, dietaPrincipal: 'Granivora',   statusConservacao: 'Vulnerável',      observacoes: 'Especie com restricoes legais. Documentacao FOB obrigatoria.' },
  { id: 5, nomeComum: 'Bicudo',               nomeCientifico: 'Sporophila maximiliani', familia: 'Thraupidae',    quantidadePlantel: 2,  corPredominante: 'Preto',         tamanhoMedio: 16.5, dietaPrincipal: 'Granivora',     statusConservacao: 'Vulnerável',      observacoes: 'Criticamente ameacado na natureza. Programa de conservacao ativo.' },
  { id: 6, nomeComum: 'Azulao',               nomeCientifico: 'Cyanoloxia brissonii',  familia: 'Cardinalidae',  quantidadePlantel: 5,  corPredominante: 'Azul-indigo',   tamanhoMedio: 15.0, dietaPrincipal: 'Onivora',       statusConservacao: 'Quase Ameaçada', observacoes: 'Aceita frutas e insetos alem de sementes.' },
  { id: 7, nomeComum: 'Trinca-ferro',         nomeCientifico: 'Saltator similis',       familia: 'Thraupidae',    quantidadePlantel: 3,  corPredominante: 'Verde-olivaceo', tamanhoMedio: 20.0, dietaPrincipal: 'Onivora',      statusConservacao: 'Quase Ameaçada', observacoes: 'Robusto. Necessita gaiolas maiores devido ao porte.' },
  { id: 8, nomeComum: 'Sabiá-laranjeira',     nomeCientifico: 'Turdus rufiventris',     familia: 'Turdidae',      quantidadePlantel: 7,  corPredominante: 'Pardo-alaranjado', tamanhoMedio: 25.0, dietaPrincipal: 'Onivora',    statusConservacao: 'Comum',           observacoes: 'Ave simbolo do Brasil. Excelente cantora ao amanhecer.' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function EspeciesModule() {
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
          // const res = await especiesService.listar()
          // setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar especies.')
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
          // const res = await especiesService.criar(form)
          // setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // const res = await especiesService.atualizar(modal.edit.id, form)
          // setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      if (!USE_MOCK) {
        // await especiesService.remover(delTarget.id)
      }
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.nomeComum, r.nomeCientifico, r.familia, r.statusConservacao]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  const totalPlantel = data.reduce((s, r) => s + (r.quantidadePlantel || 0), 0)
  const stats = {
    total:       data.length,
    plantel:     totalPlantel,
    ativas:      data.filter(r => r.statusConservacao === 'Comum').length,
    observacao:  data.filter(r => r.statusConservacao === 'Quase Ameaçada' || r.statusConservacao === 'Vulnerável').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando especies...
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
        <StatCard label="Total Especies"  value={stats.total}      desc="especies catalogadas"    color="#D4A017" />
        <StatCard label="Aves no Plantel" value={stats.plantel}    desc="total de aves"            color="#4CAF7D" />
        <StatCard label="Especies Ativas" value={stats.ativas}     desc="status comum"             color="#5BC0EB" />
        <StatCard label="Em Observacao"   value={stats.observacao} desc="quase ameacada / vulneravel" color="#F5A623" />
      </div>

      {/* Detalhe */}
      {selected && (
        <EspeciesDetail
          especie={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModal({ edit: selected }); setSelected(null) }}
        />
      )}

      {/* Tabela */}
      <div style={{ background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Especies</div>
            <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {filtered.length} de {data.length} registros
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: 220 }}
              placeholder="Buscar especie..."
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
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhuma especie encontrada</div>
          </div>
        ) : (
          <EspeciesTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <EspeciesForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <EspeciesForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover especie do catalogo?"
          message={`A especie "${delTarget.nomeComum}" sera removida. Esta acao nao pode ser desfeita.`}
          confirmLabel="Confirmar Remocao"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
