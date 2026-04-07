import { useState } from 'react'

const CATEGORIAS = ['Canário', 'Pintassilgo', 'Tarim', 'Coleiro', 'Outro']
const GENEROS    = ['Macho', 'Fêmea', 'Indeterminado']
const ORIGENS    = ['Nascido no criatório', 'Adquirida', 'Adquirido', 'Doação']
const STATUS     = ['Ativo', 'Chocando', 'Inativo']

const EMPTY = {
  nome: '', status: 'Ativo', nomeMae: '', nomePai: '',
  gaiola: '', dataNascimento: '', categoriaAve: 'Canário',
  genero: 'Macho', origem: 'Nascido no criatório',
  registroFOB: '', anelEsquerdo: '',
}

const FIELDS = [
  { key: 'nome',           label: 'Nome da Ave',       span: 2 },
  { key: 'categoriaAve',  label: 'Categoria',          type: 'select', opts: CATEGORIAS },
  { key: 'genero',         label: 'Gênero',             type: 'select', opts: GENEROS },
  { key: 'status',         label: 'Status',             type: 'select', opts: STATUS },
  { key: 'gaiola',         label: 'Gaiola' },
  { key: 'nomeMae',        label: 'Nome da Mãe' },
  { key: 'nomePai',        label: 'Nome do Pai' },
  { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date' },
  { key: 'origem',         label: 'Origem',             type: 'select', opts: ORIGENS },
  { key: 'registroFOB',   label: 'Registro FOB' },
  { key: 'anelEsquerdo',  label: 'Anel Esquerdo' },
]

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:   { background: '#0F2212', border: '1px solid rgba(201,80,37,0.2)', borderRadius: 16, width: 620, maxHeight: '90vh', overflowY: 'auto', padding: '32px 36px', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' },
  label:   { fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#7A9E7C', letterSpacing: '0.1em', textTransform: 'uppercase' },
  input:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box' },
  select:  { background: '#0F2212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#F2EDE4', fontSize: 13, fontFamily: "'DM Mono', monospace", outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
}

export function PlantelForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!initial?.id

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#F2EDE4', marginBottom: 4, fontFamily: "'DM Serif Display', serif" }}>
          {isEdit ? 'Editar Ave' : 'Cadastrar Nova Ave'}
        </div>
        <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginBottom: 28 }}>
          {isEdit ? `Editando: ${initial.nome}` : 'Preencha os campos para adicionar ao plantel'}
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
                  onFocus={e => e.target.style.borderColor = 'rgba(201,80,37,0.5)'}
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
          <button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#0A1A0C', fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: 'pointer' }}>
            {isEdit ? 'Salvar Alterações' : 'Cadastrar Ave'}
          </button>
        </div>
      </div>
    </div>
  )
}
