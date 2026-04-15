import { useState } from 'react'

const MOTIVOS    = ['Venda', 'Doação', 'Óbito', 'Fuga', 'Outro']
const CATEGORIAS = ['Canário', 'Pintassilgo', 'Tarim', 'Coleiro', 'Outro']
const GENEROS    = ['Macho', 'Fêmea', 'Indeterminado']

const EMPTY = {
  nome: '', categoriaAve: 'Canário', genero: 'Macho',
  motivoSaida: 'Venda', dataSaida: '', destinatario: '',
  valorVenda: '', registroFOB: '', anelEsquerdo: '',
  ultimaGaiola: '', observacoes: '',
}

const FIELDS = [
  { key: 'nome',          label: 'Nome da Ave',     span: 2 },
  { key: 'categoriaAve',  label: 'Categoria',        type: 'select', opts: CATEGORIAS },
  { key: 'genero',        label: 'Gênero',            type: 'select', opts: GENEROS },
  { key: 'motivoSaida',   label: 'Motivo da Saída',   type: 'select', opts: MOTIVOS },
  { key: 'dataSaida',     label: 'Data de Saída',     type: 'date' },
  { key: 'destinatario',  label: 'Destinatário' },
  { key: 'valorVenda',    label: 'Valor (R$)',         type: 'number' },
  { key: 'registroFOB',   label: 'Registro FOB' },
  { key: 'anelEsquerdo',  label: 'Anel Esquerdo' },
  { key: 'ultimaGaiola',  label: 'Última Gaiola' },
  { key: 'observacoes',   label: 'Observações',       span: 2, type: 'textarea' },
]

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:   { background: '#0F2212', border: '1px solid rgba(201,80,37,0.2)', borderRadius: 16, width: 'min(620px, calc(100vw - 24px))', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(20px, 4vw, 36px)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' },
  label:   { fontSize: 11, fontFamily: 'inherit', color: '#7A9E7C', letterSpacing: '0.1em', textTransform: 'uppercase' },
  input:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  select:  { background: '#0F2212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
  textarea:{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 60 },
}

export function ExPlantelForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!initial?.id

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4, fontFamily: "'DM Serif Display', serif" }}>
          {isEdit ? 'Editar Registro de Baixa' : 'Registrar Baixa'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 28 }}>
          {isEdit ? `Editando: ${initial.nome}` : 'Preencha os campos para registrar a saída da ave'}
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
                  onChange={e => set(f.key, e.target.value)}
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
            {isEdit ? 'Salvar Alterações' : 'Registrar Baixa'}
          </button>
        </div>
      </div>
    </div>
  )
}
