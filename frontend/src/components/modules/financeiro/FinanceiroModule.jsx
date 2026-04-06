import { useState, useEffect } from 'react'
import { StatCard }      from '../../shared/StatCard'
import { ConfirmModal }  from '../../shared/ConfirmModal'
import { FinanceiroTable }  from './FinanceiroTable'
import { FinanceiroForm }   from './FinanceiroForm'
import { FinanceiroDetail } from './FinanceiroDetail'

// ─── MOCK — remover quando backend estiver conectado ─────────────────────────
const MOCK = [
  { id: 1,  descricao: 'Venda de Canário Belga Ouro',   tipo: 'Receita',  categoria: 'Venda de Ave',  valor: 850.00,   data: '2026-03-15', formaPagamento: 'PIX',           aveRelacionada: 'Canário Belga Ouro (AN-042)',  notaFiscal: 'NF-2026-0041', status: 'Pago',      observacoes: 'Comprador: João Silva' },
  { id: 2,  descricao: 'Compra de Ração Premium 25kg',  tipo: 'Despesa',  categoria: 'Ração',         valor: 189.90,   data: '2026-03-18', formaPagamento: 'Cartão',        aveRelacionada: '—',                            notaFiscal: 'NF-2026-0043', status: 'Pago',      observacoes: 'Ração Alcon Club para canários' },
  { id: 3,  descricao: 'Venda de Pintassilgo Verde',    tipo: 'Receita',  categoria: 'Venda de Ave',  valor: 1200.00,  data: '2026-03-20', formaPagamento: 'Transferência', aveRelacionada: 'Pintassilgo Verde (AN-018)',   notaFiscal: 'NF-2026-0045', status: 'Pago',      observacoes: '' },
  { id: 4,  descricao: 'Medicamento - Antibiótico',     tipo: 'Despesa',  categoria: 'Medicamento',   valor: 67.50,    data: '2026-03-22', formaPagamento: 'Dinheiro',      aveRelacionada: 'Coleiro Sol (AN-031)',         notaFiscal: '—',            status: 'Pago',      observacoes: 'Tratamento respiratório 7 dias' },
  { id: 5,  descricao: 'Anéis IBAMA 2026',              tipo: 'Despesa',  categoria: 'Anéis',         valor: 420.00,   data: '2026-03-25', formaPagamento: 'PIX',           aveRelacionada: '—',                            notaFiscal: 'NF-2026-0048', status: 'Pago',      observacoes: 'Lote de 60 anéis' },
  { id: 6,  descricao: 'Venda de Tarim Isabela',        tipo: 'Receita',  categoria: 'Venda de Ave',  valor: 650.00,   data: '2026-03-27', formaPagamento: 'PIX',           aveRelacionada: 'Tarim Isabela (AN-055)',       notaFiscal: 'NF-2026-0050', status: 'Pendente',  observacoes: 'Aguardando pagamento do comprador' },
  { id: 7,  descricao: 'Manutenção Gaiola G-06',        tipo: 'Despesa',  categoria: 'Manutenção',    valor: 135.00,   data: '2026-03-28', formaPagamento: 'Dinheiro',      aveRelacionada: '—',                            notaFiscal: '—',            status: 'Pago',      observacoes: 'Troca da porta e comedouro' },
  { id: 8,  descricao: 'Bebedouro automático',          tipo: 'Despesa',  categoria: 'Equipamento',   valor: 245.00,   data: '2026-03-30', formaPagamento: 'Cartão',        aveRelacionada: '—',                            notaFiscal: 'NF-2026-0052', status: 'Pago',      observacoes: 'Kit com 10 unidades' },
  { id: 9,  descricao: 'Venda de Canário Mosaico',      tipo: 'Receita',  categoria: 'Venda de Ave',  valor: 980.00,   data: '2026-04-01', formaPagamento: 'Transferência', aveRelacionada: 'Canário Mosaico (AN-067)',     notaFiscal: 'NF-2026-0055', status: 'Pago',      observacoes: '' },
  { id: 10, descricao: 'Compra de Ração Farinhada 10kg',tipo: 'Despesa',  categoria: 'Ração',         valor: 95.00,    data: '2026-04-02', formaPagamento: 'PIX',           aveRelacionada: '—',                            notaFiscal: 'NF-2026-0057', status: 'Pendente',  observacoes: 'Entrega prevista para 05/04' },
  { id: 11, descricao: 'Vitaminas e suplementos',       tipo: 'Despesa',  categoria: 'Medicamento',   valor: 78.00,    data: '2026-04-03', formaPagamento: 'Dinheiro',      aveRelacionada: '—',                            notaFiscal: '—',            status: 'Pago',      observacoes: 'Nekton-S e Nekton-E' },
  { id: 12, descricao: 'Venda de Coleiro Lua',          tipo: 'Receita',  categoria: 'Venda de Ave',  valor: 500.00,   data: '2026-04-04', formaPagamento: 'PIX',           aveRelacionada: 'Coleiro Lua (AN-029)',         notaFiscal: 'NF-2026-0060', status: 'Cancelado', observacoes: 'Comprador desistiu da compra' },
]

const USE_MOCK = true // ← mudar para false quando backend estiver pronto

export function FinanceiroModule() {
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
          // const res = await financeiroService.listar()
          // setData(res.items || [])
          setLoading(false)
        }
      } catch (e) {
        setError('Erro ao carregar registros financeiros.')
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
          // const res = await financeiroService.criar(form)
          // setData(d => [...d, res.item])
        }
      } else {
        if (USE_MOCK) {
          setData(d => d.map(r => r.id === modal.edit.id ? { ...form, id: r.id } : r))
          if (selected?.id === modal.edit.id) setSelected({ ...form, id: modal.edit.id })
        } else {
          // const res = await financeiroService.atualizar(modal.edit.id, form)
          // setData(d => d.map(r => r.id === modal.edit.id ? res.item : r))
        }
      }
      setModal(null)
    } catch { setError('Erro ao salvar.') }
  }

  const handleDelete = async () => {
    try {
      // if (!USE_MOCK) await financeiroService.remover(delTarget.id)
      setData(d => d.filter(r => r.id !== delTarget.id))
      if (selected?.id === delTarget.id) setSelected(null)
      setDelTarget(null)
    } catch { setError('Erro ao remover.') }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = data.filter(r =>
    [r.descricao, r.tipo, r.categoria, r.status, r.aveRelacionada, r.formaPagamento]
      .join(' ').toLowerCase()
      .includes(search.toLowerCase())
  )

  // ─── Stats ────────────────────────────────────────────────────────────────
  const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const receitas  = data.filter(r => r.tipo === 'Receita'  && r.status === 'Pago').reduce((s, r) => s + r.valor, 0)
  const despesas  = data.filter(r => r.tipo === 'Despesa'  && r.status === 'Pago').reduce((s, r) => s + r.valor, 0)
  const saldo     = receitas - despesas
  const pendentes = data.filter(r => r.status === 'Pendente').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#5A7A5C', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
      Carregando registros financeiros...
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
        <StatCard label="Receitas"   value={`R$ ${fmt(receitas)}`}  desc="total recebido (pagos)" color="#4CAF7D" />
        <StatCard label="Despesas"   value={`R$ ${fmt(despesas)}`}  desc="total gasto (pagos)"    color="#E05C4B" />
        <StatCard label="Saldo"      value={`R$ ${fmt(saldo)}`}     desc="receitas - despesas"    color={saldo >= 0 ? '#D4A017' : '#E05C4B'} />
        <StatCard label="Pendentes"  value={pendentes}              desc="aguardando pagamento"   color="#8A9E8C" />
      </div>

      {/* Detalhe */}
      {selected && (
        <FinanceiroDetail
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE4', fontFamily: "'DM Serif Display', serif" }}>Financeiro</div>
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
              + Adicionar
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3A5C3C' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>$</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: '#4A6A4C' }}>Nenhum registro financeiro encontrado</div>
          </div>
        ) : (
          <FinanceiroTable
            data={filtered}
            onRowClick={row => setSelected(s => s?.id === row.id ? null : row)}
            onEdit={row => setModal({ edit: row })}
            onDelete={row => setDelTarget(row)}
          />
        )}
      </div>

      {/* Modais */}
      {modal === 'add' && <FinanceiroForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.edit    && <FinanceiroForm initial={modal.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {delTarget && (
        <ConfirmModal
          title="Remover registro?"
          message={`O registro "${delTarget.descricao}" sera removido. Esta acao nao pode ser desfeita.`}
          confirmLabel="Confirmar Remocao"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
