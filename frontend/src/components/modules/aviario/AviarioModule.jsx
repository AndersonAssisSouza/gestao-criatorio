import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../../shared/StatCard'
import { ConfirmModal } from '../../shared/ConfirmModal'
import { useAuth } from '../../../context/AuthContext'
import { criatorioService } from '../../../services/criatorio.service'

const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_CRIATORIO = {
  id: 'c30e294f-b7e8-4a63-8e38-39c55cb4b4b6',
  NomeCriatorio: 'Criatório Assis',
  Responsavel: 'Anderson Assis',
  CTFCriador: '5177616',
  Endereco: 'Belo Horizonte - MG',
  Telefone: '31988761694',
}

const s = {
  input: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '12px 14px', color: 'var(--text-main)', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  label: {
    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, display: 'block',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #C95025, #A0401D)', border: 'none',
    borderRadius: 14, padding: '12px 20px', color: 'var(--text-main)', fontSize: 12,
    fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '12px 20px', color: 'var(--text-soft)', fontSize: 12,
    fontFamily: 'inherit', cursor: 'pointer',
  },
  card: {
    overflow: 'hidden',
  },
}

const createEmptyForm = (currentUser) => ({
  NomeCriatorio: '',
  Responsavel: currentUser,
  CTFCriador: '',
  Endereco: '',
  Telefone: '',
})

export function AviarioModule() {
  const { user } = useAuth()
  const currentUser = user?.name || user?.email || 'Usuário'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newForm, setNewForm] = useState(() => createEmptyForm(currentUser))
  const [delTarget, setDelTarget] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCriatorio = async () => {
    setLoading(true)
    if (USE_MOCK) {
      setTimeout(() => {
        setSelected(MOCK_CRIATORIO)
        setEditForm({ ...MOCK_CRIATORIO })
        setIsAdding(false)
        setError('')
        setLoading(false)
      }, 400)
      return
    }
    try {
      const response = await criatorioService.listarMeu()
      const item = response.item || response.items?.[0] || null
      setSelected(item)
      setEditForm(item ? { ...item } : null)
      setIsAdding(false)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível carregar seu criatório.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setNewForm(createEmptyForm(currentUser))
  }, [currentUser])

  useEffect(() => {
    loadCriatorio()
  }, [])

  useEffect(() => {
    if (selected) {
      setEditForm({
        NomeCriatorio: selected.NomeCriatorio || '',
        Responsavel: selected.Responsavel || '',
        CTFCriador: selected.CTFCriador || '',
        Endereco: selected.Endereco || '',
        Telefone: selected.Telefone || '',
        id: selected.id,
      })
    }
  }, [selected])

  const filtered = useMemo(() => {
    const records = selected ? [selected] : []
    return records.filter((record) =>
      [record.NomeCriatorio, record.Responsavel, record.CTFCriador, record.Endereco, record.Telefone]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [search, selected])

  const stats = {
    total: selected ? 1 : 0,
  }

  const clearFeedback = () => {
    setError('')
    setSuccess('')
  }

  const handleCreate = async () => {
    clearFeedback()
    setSaving(true)

    try {
      await criatorioService.criar(newForm)
      setSuccess('Criatório cadastrado com sucesso.')
      await loadCriatorio()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível criar o criatório.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selected?.id) return

    clearFeedback()
    setSaving(true)

    try {
      const response = await criatorioService.atualizar(selected.id, editForm)
      setSelected(response.item)
      setSuccess('Criatório atualizado com sucesso.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível atualizar o criatório.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!delTarget?.id) return

    clearFeedback()
    setSaving(true)

    try {
      await criatorioService.remover(delTarget.id)
      setSelected(null)
      setEditForm(null)
      setIsAdding(false)
      setNewForm(createEmptyForm(currentUser))
      setSuccess('Criatório removido com sucesso.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível remover o criatório.')
    } finally {
      setSaving(false)
      setDelTarget(null)
    }
  }

  const renderForm = (form, setForm) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={s.label}>Nome do Criatório</label>
        <input style={s.input} value={form.NomeCriatorio} onChange={(e) => setForm((value) => ({ ...value, NomeCriatorio: e.target.value }))} placeholder="Nome do criatório" />
      </div>
      <div>
        <label style={s.label}>Responsável</label>
        <input style={s.input} value={form.Responsavel} onChange={(e) => setForm((value) => ({ ...value, Responsavel: e.target.value }))} placeholder="Nome do responsável" />
      </div>
      <div>
        <label style={s.label}>CTF Criador</label>
        <input style={s.input} value={form.CTFCriador} onChange={(e) => setForm((value) => ({ ...value, CTFCriador: e.target.value }))} placeholder="Ex: CTF-001234" />
      </div>
      <div>
        <label style={s.label}>Endereço</label>
        <input style={s.input} value={form.Endereco} onChange={(e) => setForm((value) => ({ ...value, Endereco: e.target.value }))} placeholder="Cidade - UF" />
      </div>
      <div>
        <label style={s.label}>Usuário vinculado</label>
        <input style={{ ...s.input, opacity: 0.72, cursor: 'not-allowed' }} value={user?.email || currentUser} disabled readOnly />
      </div>
      <div>
        <label style={s.label}>Telefone</label>
        <input style={s.input} value={form.Telefone} onChange={(e) => setForm((value) => ({ ...value, Telefone: e.target.value }))} placeholder="(XX) XXXXX-XXXX" />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
        Carregando criatório...
      </div>
    )
  }

  return (
    <div>
      <div className="module-hero">
        <div>
          <div className="module-hero__eyebrow">Cadastro base</div>
          <h2 className="module-hero__title">Cadastro de criatórios</h2>
          <div className="module-hero__text">
            O acesso ao plantel agora é amarrado ao criatório do usuário. Mantenha este cadastro correto para garantir isolamento de dados.
          </div>
        </div>
        <div className="pill">Registro único</div>
      </div>

      {error && (
        <div style={{ background: 'rgba(224,92,75,0.1)', border: '1px solid rgba(224,92,75,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#E05C4B', fontSize: 13, fontFamily: 'inherit' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#8FE0B1', fontSize: 13, fontFamily: 'inherit' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Meu Criadouro" value={stats.total} desc="registro vinculado à sessão" color="#C95025" />
        <StatCard label="Usuário Atual" value={currentUser} desc={user?.email || 'sessão autenticada'} color="#4CAF7D" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="module-panel" style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>Meu criadouro</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2 }}>
                {filtered.length} registro disponível
              </div>
            </div>
            <button
              onClick={() => {
                clearFeedback()
                if (selected) {
                  setError('Cada usuário pode ter apenas um criatório. Edite o cadastro já existente.')
                  return
                }
                setIsAdding(true)
                setNewForm(createEmptyForm(currentUser))
              }}
              style={{ ...s.btnPrimary, opacity: selected ? 0.55 : 1, cursor: selected ? 'not-allowed' : 'pointer' }}
              disabled={!!selected}
            >
              + Novo Criatório
            </button>
          </div>

          <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              style={s.input}
              placeholder="Buscar criatório..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: 14, fontFamily: 'inherit', color: 'var(--text-muted)' }}>
                  {selected ? 'Nenhum criatório encontrado com esse filtro.' : 'Nenhum criatório cadastrado para esta conta.'}
                </div>
              </div>
            ) : filtered.map((record) => (
              <div
                key={record.id}
                onClick={() => {
                  clearFeedback()
                  setIsAdding(false)
                  setSelected(record)
                }}
                style={{
                  padding: '14px 22px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: selected?.id === record.id ? 'rgba(201,80,37,0.08)' : 'transparent',
                  borderLeft: selected?.id === record.id ? '3px solid #C95025' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>
                      {record.NomeCriatorio}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'inherit', marginTop: 2 }}>
                      {record.Responsavel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2 }}>
                      {record.Endereco} | CTF: {record.CTFCriador || 'não informado'}
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setDelTarget(record)
                    }}
                    style={{ background: 'none', border: 'none', color: '#E05C4B', cursor: 'pointer', fontSize: 14, opacity: 0.5, padding: 4 }}
                    title="Remover"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="module-panel" style={s.card}>
          {isAdding ? (
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>
                Novo Criatório
              </div>
              {renderForm(newForm, setNewForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleCreate} style={s.btnPrimary} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setIsAdding(false)} style={s.btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : selected && editForm ? (
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>
                {selected.NomeCriatorio} - {selected.Responsavel}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 20 }}>
                Edite o único criatório vinculado à sua conta
              </div>
              {renderForm(editForm, setEditForm)}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleSaveEdit} style={s.btnPrimary} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
              </div>
            </div>
          ) : (
            <div className="module-empty">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'inherit', lineHeight: 1.6 }}>
                  Cadastre seu criatório para liberar o<br />escopo seguro do plantel e dos demais módulos
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {delTarget && (
        <ConfirmModal
          title="Remover criatório?"
          message={`O criatório "${delTarget.NomeCriatorio}" será removido. Essa ação também bloqueia o acesso ao plantel até que um novo criatório seja cadastrado.`}
          confirmLabel="Confirmar Remoção"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}
