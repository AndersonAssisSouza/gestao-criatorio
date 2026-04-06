import { useState } from 'react'

const TIPOS   = ['IBAMA', 'FOB', 'Criadouro']
const STATUS  = ['Utilizado', 'Disponivel', 'Extraviado']

const EMPTY = {
  codigo: '', tipo: 'IBAMA', diametro: '', cor: '',
  aveAssociada: '', dataColocacao: '', lote: '',
  status: 'Disponivel', observacoes: '',
}

const FIELDS = [
  { key: 'codigo',        label: 'Codigo do Anel',     span: 1 },
  { key: 'tipo',          label: 'Tipo',               type: 'select', opts: TIPOS },
  { key: 'diametro',      label: 'Diametro (mm)',      type: 'number' },
  { key: 'cor',           label: 'Cor',                span: 1 },
  { key: 'aveAssociada',  label: 'Ave Associada',      span: 1 },
  { key: 'dataColocacao', label: 'Data de Colocacao',  type: 'date' },
  { key: 'lote',          label: 'Lote',               span: 1 },
  { key: 'status',        label: 'Status',             type: 'select', opts: STATUS },
  { key: 'observacoes',   label: 'Observacoes',        span: 2 },
]

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:   { background: '#0F2212', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 16, width: 620, maxHeight: '90vh', overflowY: 'auto', padding: '32px 36px', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' },
  label:   { fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#7A9E7C', letterSpacing: '0.1em', textTransform: 'uppercase' },
  input:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box' },
  select:  { background: '#0F2212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
}

export function AneisForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!initial?.id

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#F2EDE4', marginBottom: 4, fontFamily: "'DM Serif Display', serif" }}>
          {isEdit ? 'Editar Anel' : 'Cadastrar Novo Anel'}
        </div>
        <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginBottom: 28 }}>
          {isEdit ? `Editando: ${initial.codigo}` : 'Preencha os campos para adicionar um anel'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 24 }}>
          {FIELDS.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: f.span === 2 ? 'span 2' : 'span 1' }}>
              <label style={S.label}>{f.label}</label>
              {f.type === 'select' ? (
                <select style={S.select} value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  style={S.input}
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,160,23,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', color: '#8A9E8C', fontSize: 13, fontFamily: "'DM Mono', monospace", cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #D4A017, #B8870F)', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#0A1A0C', fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer' }}>
            {isEdit ? 'Salvar Alteracoes' : 'Cadastrar Anel'}
          </button>
        </div>
      </div>
    </div>
  )
}
