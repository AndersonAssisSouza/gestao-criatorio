import { useState } from 'react'

const STATUS_CONSERVACAO = ['Comum', 'Quase Ameaçada', 'Vulnerável']
const DIETAS             = ['Granivora', 'Onivora', 'Frugivora', 'Insetivora']

const EMPTY = {
  nomeComum: '', nomeCientifico: '', familia: '',
  quantidadePlantel: 0, corPredominante: '', tamanhoMedio: '',
  dietaPrincipal: 'Granivora', statusConservacao: 'Comum', observacoes: '',
}

const FIELDS = [
  { key: 'nomeComum',          label: 'Nome Comum',          span: 1 },
  { key: 'nomeCientifico',     label: 'Nome Cientifico',     span: 1 },
  { key: 'familia',            label: 'Familia',             span: 1 },
  { key: 'corPredominante',    label: 'Cor Predominante',    span: 1 },
  { key: 'quantidadePlantel',  label: 'Qtd. no Plantel',     type: 'number' },
  { key: 'tamanhoMedio',       label: 'Tamanho Medio (cm)',   type: 'number' },
  { key: 'dietaPrincipal',     label: 'Dieta Principal',      type: 'select', opts: DIETAS },
  { key: 'statusConservacao',  label: 'Status Conservacao',   type: 'select', opts: STATUS_CONSERVACAO },
  { key: 'observacoes',        label: 'Observacoes',          type: 'textarea', span: 2 },
]

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:   { background: '#0F2212', border: '1px solid rgba(201,80,37,0.2)', borderRadius: 16, width: 'min(620px, calc(100vw - 24px))', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(20px, 4vw, 36px)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' },
  label:   { fontSize: 11, fontFamily: 'inherit', color: '#7A9E7C', letterSpacing: '0.1em', textTransform: 'uppercase' },
  input:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  select:  { background: '#0F2212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
  textarea:{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 70 },
}

export function EspeciesForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!initial?.id

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4, fontFamily: "'DM Serif Display', serif" }}>
          {isEdit ? 'Editar Especie' : 'Cadastrar Nova Especie'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 28 }}>
          {isEdit ? `Editando: ${initial.nomeComum}` : 'Preencha os campos para catalogar a especie'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 24 }}>
          {FIELDS.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: f.span === 2 ? 'span 2' : 'span 1' }}>
              <label style={S.label}>{f.label}</label>
              {f.type === 'select' ? (
                <select style={S.select} value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  style={S.textarea}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,80,37,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              ) : (
                <input
                  style={S.input}
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => set(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,80,37,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', color: 'var(--text-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#0A1A0C', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
            {isEdit ? 'Salvar Alteracoes' : 'Cadastrar Especie'}
          </button>
        </div>
      </div>
    </div>
  )
}
