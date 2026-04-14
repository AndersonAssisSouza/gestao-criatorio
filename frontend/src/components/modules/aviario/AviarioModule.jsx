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
    <div className="flex-col gap-2">
      <div className="p-field">
        <label className="p-label">Nome do Criatório</label>
        <input className="p-input" value={form.NomeCriatorio} onChange={(e) => setForm((value) => ({ ...value, NomeCriatorio: e.target.value }))} placeholder="Nome do criatório" />
      </div>
      <div className="p-field">
        <label className="p-label">Responsável</label>
        <input className="p-input" value={form.Responsavel} onChange={(e) => setForm((value) => ({ ...value, Responsavel: e.target.value }))} placeholder="Nome do responsável" />
      </div>
      <div className="p-field">
        <label className="p-label">CTF Criador</label>
        <input className="p-input" value={form.CTFCriador} onChange={(e) => setForm((value) => ({ ...value, CTFCriador: e.target.value }))} placeholder="Ex: CTF-001234" />
      </div>
      <div className="p-field">
        <label className="p-label">Endereço</label>
        <input className="p-input" value={form.Endereco} onChange={(e) => setForm((value) => ({ ...value, Endereco: e.target.value }))} placeholder="Cidade - UF" />
      </div>
      <div className="p-field">
        <label className="p-label">Usuário vinculado</label>
        <input className="p-input" style={{ opacity: 0.72, cursor: 'not-allowed' }} value={user?.email || currentUser} disabled readOnly />
      </div>
      <div className="p-field">
        <label className="p-label">Telefone</label>
        <input className="p-input" value={form.Telefone} onChange={(e) => setForm((value) => ({ ...value, Telefone: e.target.value }))} placeholder="(XX) XXXXX-XXXX" />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center text-muted" style={{ height: '50vh', fontSize: 13 }}>
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
        <div className="p-alert--error">
          {error}
        </div>
      )}

      {success && (
        <div className="p-alert--success">
          {success}
        </div>
      )}

      <div className="p-stats mb-3">
        <StatCard label="Meu Criadouro" value={stats.total} desc="registro vinculado à sessão" color="#C95025" />
        <StatCard label="Usuário Atual" value={currentUser} desc={user?.email || 'sessão autenticada'} color="#4CAF7D" />
      </div>

      <div className="p-split">
        <div className="module-panel">
          <div className="p-panel-header">
            <div>
              <div className="p-panel-header__title">Meu criadouro</div>
              <div className="p-panel-header__subtitle">
                {filtered.length} registro disponível
              </div>
            </div>
            <button
              className="p-btn p-btn--primary"
              onClick={() => {
                clearFeedback()
                if (selected) {
                  setError('Cada usuário pode ter apenas um criatório. Edite o cadastro já existente.')
                  return
                }
                setIsAdding(true)
                setNewForm(createEmptyForm(currentUser))
              }}
              style={{ opacity: selected ? 0.55 : 1, cursor: selected ? 'not-allowed' : 'pointer' }}
              disabled={!!selected}
            >
              + Novo Criatório
            </button>
          </div>

          <div className="p-panel-search">
            <input
              className="p-search"
              placeholder="Buscar criatório..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="p-panel-list">
            {filtered.length === 0 ? (
              <div className="module-empty">
                <div className="text-muted" style={{ fontSize: 14 }}>
                  {selected ? 'Nenhum criatório encontrado com esse filtro.' : 'Nenhum criatório cadastrado para esta conta.'}
                </div>
              </div>
            ) : filtered.map((record) => (
              <div
                key={record.id}
                className={`p-list-item ${selected?.id === record.id ? 'is-active' : ''}`}
                onClick={() => {
                  clearFeedback()
                  setIsAdding(false)
                  setSelected(record)
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif" style={{ fontSize: 16, fontWeight: 700 }}>
                      {record.NomeCriatorio}
                    </div>
                    <div className="text-faint" style={{ fontSize: 12, marginTop: 2 }}>
                      {record.Responsavel}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {record.Endereco} | CTF: {record.CTFCriador || 'não informado'}
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setDelTarget(record)
                    }}
                    className="p-btn p-btn--ghost p-btn--sm"
                    style={{ color: '#E05C4B', opacity: 0.5 }}
                    title="Remover"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="module-panel">
          {isAdding ? (
            <div className="p-panel-body">
              <div className="p-panel-header__title mb-2" style={{ fontSize: 22 }}>
                Novo Criatório
              </div>
              {renderForm(newForm, setNewForm)}
              <div className="flex gap-1 mt-2">
                <button className="p-btn p-btn--primary" onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                <button className="p-btn p-btn--secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
              </div>
            </div>
          ) : selected && editForm ? (
            <div className="p-panel-body">
              <div className="p-panel-header__title" style={{ fontSize: 22 }}>
                {selected.NomeCriatorio} - {selected.Responsavel}
              </div>
              <div className="text-muted mb-2" style={{ fontSize: 12 }}>
                Edite o único criatório vinculado à sua conta
              </div>
              {renderForm(editForm, setEditForm)}
              <div className="flex gap-1 mt-2">
                <button className="p-btn p-btn--primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
              </div>
            </div>
          ) : (
            <div className="module-empty">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>&#9675;</div>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
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
