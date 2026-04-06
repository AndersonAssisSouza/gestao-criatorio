import { useState } from 'react'
import { StatCard } from '../../shared/StatCard'

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const AVES_MACHO = [
  { id: 1, nome: 'Canario Ouro',      mutacoes: ['Intenso', 'Lipocromico'] },
  { id: 2, nome: 'Canario Bronze',    mutacoes: ['Nevado', 'Melanico'] },
  { id: 3, nome: 'Pintassilgo Limao', mutacoes: ['Classico'] },
  { id: 4, nome: 'Canario Mosaico',   mutacoes: ['Mosaico', 'Lipocromico'] },
  { id: 5, nome: 'Tarim Classico',    mutacoes: ['Classico', 'Oxidado'] },
]
const AVES_FEMEA = [
  { id: 1, nome: 'Pintassilgo Verde',       mutacoes: ['Classico', 'Lipocromico'] },
  { id: 2, nome: 'Tarim Isabela',           mutacoes: ['Isabela', 'Diluido'] },
  { id: 3, nome: 'Tarim Agata',             mutacoes: ['Agata', 'Lipocromico'] },
  { id: 4, nome: 'Pintassilgo Ambar',       mutacoes: ['Ambar', 'Oxidado'] },
  { id: 5, nome: 'Canario Femea Intensa',   mutacoes: ['Intenso', 'Lipocromico'] },
]

// ─── MUTATION BADGE COLORS ──────────────────────────────────────────────────
const MUTATION_COLORS = {
  Intenso:     { bg: 'rgba(212,160,23,0.18)', text: '#D4A017', border: 'rgba(212,160,23,0.35)' },
  Nevado:      { bg: 'rgba(91,192,235,0.15)', text: '#5BC0EB', border: 'rgba(91,192,235,0.30)' },
  Mosaico:     { bg: 'rgba(232,141,180,0.15)', text: '#E88DB4', border: 'rgba(232,141,180,0.30)' },
  Lipocromico: { bg: 'rgba(245,213,71,0.15)', text: '#F5D547', border: 'rgba(245,213,71,0.30)' },
  Melanico:    { bg: 'rgba(138,158,140,0.20)', text: '#8A9E8C', border: 'rgba(138,158,140,0.35)' },
  Classico:    { bg: 'rgba(76,175,125,0.15)', text: '#4CAF7D', border: 'rgba(76,175,125,0.30)' },
  Isabela:     { bg: 'rgba(196,149,106,0.18)', text: '#C4956A', border: 'rgba(196,149,106,0.35)' },
  Agata:       { bg: 'rgba(155,142,196,0.15)', text: '#9B8EC4', border: 'rgba(155,142,196,0.30)' },
  Diluido:     { bg: 'rgba(125,206,160,0.15)', text: '#7DCEA0', border: 'rgba(125,206,160,0.30)' },
  Ambar:       { bg: 'rgba(245,166,35,0.18)', text: '#F5A623', border: 'rgba(245,166,35,0.35)' },
  Oxidado:     { bg: 'rgba(196,106,90,0.18)', text: '#C46A5A', border: 'rgba(196,106,90,0.35)' },
}
const DEFAULT_BADGE = { bg: 'rgba(90,122,92,0.20)', text: '#5A7A5C', border: 'rgba(90,122,92,0.35)' }

// ─── PHENOTYPE TEMPLATES ────────────────────────────────────────────────────
const PHENOTYPE_TEMPLATES = [
  'Portador de {m}',
  '{m} puro',
  'Fator {m} simples',
  'Fator {m} duplo',
  '{m} heterozigoto',
  'Tipo selvagem portador de {m}',
  '{m} parcial',
  'Combinado {m}',
]

// ─── SIMULATION ENGINE ──────────────────────────────────────────────────────
function simulateCrossing(pai, mae) {
  const allMutations = [...new Set([...pai.mutacoes, ...mae.mutacoes])]
  const shared = pai.mutacoes.filter(m => mae.mutacoes.includes(m))
  const paiOnly = pai.mutacoes.filter(m => !mae.mutacoes.includes(m))
  const maeOnly = mae.mutacoes.filter(m => !pai.mutacoes.includes(m))

  const outcomes = []

  // Outcome 1: shared mutations dominant
  if (shared.length > 0) {
    outcomes.push({
      fenotipo: shared.map(m => `${m} puro`).join(' + '),
      probabilidade: 25,
      mutacoes: shared,
    })
  }

  // Outcome 2: father-dominant
  if (paiOnly.length > 0) {
    outcomes.push({
      fenotipo: paiOnly.map(m => `Portador de ${m}`).join(', '),
      probabilidade: shared.length > 0 ? 25 : 50,
      mutacoes: [...paiOnly, ...shared],
    })
  }

  // Outcome 3: mother-dominant
  if (maeOnly.length > 0) {
    outcomes.push({
      fenotipo: maeOnly.map(m => `Fator ${m} simples`).join(', '),
      probabilidade: shared.length > 0 ? 25 : 50,
      mutacoes: [...maeOnly, ...shared],
    })
  }

  // Outcome 4: full combination
  if (paiOnly.length > 0 && maeOnly.length > 0) {
    outcomes.push({
      fenotipo: `Combinado ${[...paiOnly, ...maeOnly].join(' + ')}`,
      probabilidade: 12.5,
      mutacoes: allMutations,
    })
  }

  // Outcome 5: wild type / type selvagem
  outcomes.push({
    fenotipo: 'Tipo selvagem' + (allMutations.length > 0 ? ` (portador de ${allMutations[0]})` : ''),
    probabilidade: outcomes.length < 3 ? 25 : 12.5,
    mutacoes: allMutations.length > 0 ? [allMutations[0]] : [],
  })

  // Outcome 6: recessive combination
  if (allMutations.length >= 2) {
    const pick = [allMutations[allMutations.length - 1], allMutations[0]]
    outcomes.push({
      fenotipo: `${pick[0]} heterozigoto + ${pick[1]}`,
      probabilidade: 6.25,
      mutacoes: pick,
    })
  }

  // Normalize percentages to ~100
  const total = outcomes.reduce((s, o) => s + o.probabilidade, 0)
  if (total !== 100) {
    const factor = 100 / total
    outcomes.forEach(o => {
      o.probabilidade = Math.round(o.probabilidade * factor * 100) / 100
    })
  }

  return outcomes
}

// ─── BADGE COMPONENT ────────────────────────────────────────────────────────
function MutationBadge({ mutation, size = 'normal' }) {
  const c = MUTATION_COLORS[mutation] || DEFAULT_BADGE
  const isSmall = size === 'small'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: isSmall ? '2px 8px' : '3px 12px',
      fontSize: isSmall ? 10 : 11, fontFamily: "'DM Mono', monospace",
      fontWeight: 500, letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: isSmall ? 5 : 6, height: isSmall ? 5 : 6, borderRadius: '50%',
        background: c.text, marginRight: isSmall ? 4 : 6, opacity: 0.8, flexShrink: 0,
      }} />
      {mutation}
    </span>
  )
}

// ─── DETAIL MODAL ───────────────────────────────────────────────────────────
function SimulationDetailModal({ sim, onClose }) {
  if (!sim) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'rgba(21,40,24,0.95)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 32, width: '90%', maxWidth: 640, maxHeight: '80vh',
        overflowY: 'auto', position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #D4A017, #F5A623)', opacity: 0.7,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F2EDE4', margin: 0,
          }}>
            Detalhes da Simulacao
          </h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
            color: '#5A7A5C', borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>
            X
          </button>
        </div>

        <div style={{
          display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
        }}>
          <div style={{
            background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 180,
          }}>
            <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 4 }}>
              Pai (Macho)
            </div>
            <div style={{ fontSize: 15, color: '#F2EDE4', fontWeight: 600, marginBottom: 6 }}>
              {sim.pai.nome}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {sim.pai.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', color: '#D4A017',
            fontSize: 20, fontWeight: 700, alignSelf: 'center',
          }}>
            x
          </div>
          <div style={{
            background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 180,
          }}>
            <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 4 }}>
              Mae (Femea)
            </div>
            <div style={{ fontSize: 15, color: '#F2EDE4', fontWeight: 600, marginBottom: 6 }}>
              {sim.mae.nome}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {sim.mae.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 10 }}>
          Resultados possiveis ({sim.resultados.length})
        </div>

        {sim.resultados.map((r, i) => (
          <div key={i} style={{
            background: 'rgba(21,40,24,0.5)', border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: `conic-gradient(#D4A017 0% ${r.probabilidade}%, rgba(90,122,92,0.25) ${r.probabilidade}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8, background: 'rgba(21,40,24,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#D4A017', fontWeight: 700,
              }}>
                {r.probabilidade}%
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ fontSize: 13, color: '#F2EDE4', fontWeight: 500, marginBottom: 6 }}>
                {r.fenotipo}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
              </div>
            </div>
          </div>
        ))}

        <div style={{ fontSize: 10, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", marginTop: 16, textAlign: 'center' }}>
          Simulacao #{sim.id} - {sim.data}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN MODULE ────────────────────────────────────────────────────────────
export function MutacoesModule() {
  const [paiId, setPaiId]         = useState('')
  const [maeId, setMaeId]         = useState('')
  const [resultados, setResultados] = useState(null)
  const [historico, setHistorico] = useState([])
  const [detailSim, setDetailSim] = useState(null)
  const [animating, setAnimating] = useState(false)

  const pai = AVES_MACHO.find(a => a.id === Number(paiId))
  const mae = AVES_FEMEA.find(a => a.id === Number(maeId))

  const allMutations = new Set()
  ;[...AVES_MACHO, ...AVES_FEMEA].forEach(a => a.mutacoes.forEach(m => allMutations.add(m)))
  const totalCombinacoes = AVES_MACHO.length * AVES_FEMEA.length

  const handleSimular = () => {
    if (!pai || !mae) return
    setAnimating(true)
    setResultados(null)

    setTimeout(() => {
      const outcomes = simulateCrossing(pai, mae)
      setResultados(outcomes)
      setAnimating(false)

      const entry = {
        id: historico.length + 1,
        pai: { ...pai },
        mae: { ...mae },
        data: new Date().toLocaleDateString('pt-BR'),
        resultados: outcomes,
      }
      setHistorico(h => [entry, ...h])
    }, 800)
  }

  // ─── STYLES ─────────────────────────────────────────────────────────────
  const selectStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'rgba(10,26,12,0.8)', border: '1px solid rgba(255,255,255,0.07)',
    color: '#F2EDE4', fontSize: 14, fontFamily: "'DM Mono', monospace",
    outline: 'none', cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235A7A5C' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  }

  return (
    <div>
      {/* ─── STAT CARDS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Simulacoes"    value={historico.length}       desc="realizadas nesta sessao"           color="#D4A017" />
        <StatCard label="Ultima Simulacao"    value={historico.length > 0 ? historico[0].data : '---'}  desc={historico.length > 0 ? `${historico[0].pai.nome} x ${historico[0].mae.nome}` : 'nenhuma ainda'} color="#F5A623" />
        <StatCard label="Mutacoes Catalogadas" value={allMutations.size}     desc="tipos distintos"                    color="#4CAF7D" />
        <StatCard label="Combinacoes Possiveis" value={totalCombinacoes}     desc="cruzamentos diferentes"             color="#9B8EC4" />
      </div>

      {/* ─── PARENT SELECTION ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'stretch', marginBottom: 24 }}>
        {/* PAI */}
        <div style={{
          background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #5BC0EB, #4CAF7D)', opacity: 0.6,
          }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(91,192,235,0.12)', border: '1px solid rgba(91,192,235,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              <span role="img" aria-label="male">M</span>
            </div>
            <div>
              <div style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F2EDE4',
              }}>
                Pai (Macho)
              </div>
              <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
                Selecione o reprodutor
              </div>
            </div>
          </div>

          <select value={paiId} onChange={e => { setPaiId(e.target.value); setResultados(null) }} style={selectStyle}>
            <option value="">-- Escolha uma ave --</option>
            {AVES_MACHO.map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>

          {pai && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>
                Mutacoes / Fenotipos
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {pai.mutacoes.map(m => <MutationBadge key={m} mutation={m} />)}
              </div>
            </div>
          )}

          {!pai && (
            <div style={{
              marginTop: 14, padding: '20px 16px', borderRadius: 10,
              background: 'rgba(10,26,12,0.5)', border: '1px dashed rgba(255,255,255,0.04)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>?</div>
              <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace" }}>
                Nenhum macho selecionado
              </div>
            </div>
          )}
        </div>

        {/* CONNECTOR */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: animating
              ? 'linear-gradient(135deg, #D4A017, #F5A623)'
              : 'rgba(21,40,24,0.8)',
            border: '2px solid rgba(212,160,23,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.4s ease',
            boxShadow: animating ? '0 0 20px rgba(212,160,23,0.3)' : 'none',
          }}>
            <span style={{
              fontSize: 18, fontWeight: 700, color: animating ? '#0A1A0C' : '#D4A017',
              fontFamily: "'DM Serif Display', serif",
            }}>
              X
            </span>
          </div>
          <div style={{
            width: 2, height: 30, background: 'rgba(212,160,23,0.15)', marginTop: 6,
          }} />
        </div>

        {/* MAE */}
        <div style={{
          background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #E88DB4, #9B8EC4)', opacity: 0.6,
          }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(232,141,180,0.12)', border: '1px solid rgba(232,141,180,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              <span role="img" aria-label="female">F</span>
            </div>
            <div>
              <div style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F2EDE4',
              }}>
                Mae (Femea)
              </div>
              <div style={{ fontSize: 11, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
                Selecione a matriz
              </div>
            </div>
          </div>

          <select value={maeId} onChange={e => { setMaeId(e.target.value); setResultados(null) }} style={selectStyle}>
            <option value="">-- Escolha uma ave --</option>
            {AVES_FEMEA.map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>

          {mae && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>
                Mutacoes / Fenotipos
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {mae.mutacoes.map(m => <MutationBadge key={m} mutation={m} />)}
              </div>
            </div>
          )}

          {!mae && (
            <div style={{
              marginTop: 14, padding: '20px 16px', borderRadius: 10,
              background: 'rgba(10,26,12,0.5)', border: '1px dashed rgba(255,255,255,0.04)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>?</div>
              <div style={{ fontSize: 11, color: '#4A6A4C', fontFamily: "'DM Mono', monospace" }}>
                Nenhuma femea selecionada
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SIMULATE BUTTON ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <button
          onClick={handleSimular}
          disabled={!pai || !mae || animating}
          style={{
            background: pai && mae && !animating
              ? 'linear-gradient(135deg, #D4A017, #B8860B)'
              : 'rgba(90,122,92,0.2)',
            color: pai && mae && !animating ? '#0A1A0C' : '#5A7A5C',
            border: 'none', borderRadius: 12, padding: '14px 48px',
            fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.06em', cursor: pai && mae && !animating ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: pai && mae && !animating ? '0 4px 20px rgba(212,160,23,0.25)' : 'none',
          }}
        >
          {animating ? 'Simulando...' : 'Simular Cruzamento'}
        </button>
      </div>

      {/* ─── LOADING ANIMATION ───────────────────────────────────── */}
      {animating && (
        <div style={{
          textAlign: 'center', padding: '30px 0',
        }}>
          <div style={{
            display: 'inline-flex', gap: 6, alignItems: 'center',
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%', background: '#D4A017',
                animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                opacity: 0.5,
              }} />
            ))}
          </div>
          <div style={{
            fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", marginTop: 10,
          }}>
            Calculando probabilidades geneticas...
          </div>
          <style>{`@keyframes pulse { to { opacity: 1; transform: scale(1.3); } }`}</style>
        </div>
      )}

      {/* ─── RESULTS ─────────────────────────────────────────────── */}
      {resultados && !animating && (
        <div style={{
          background: 'rgba(21,40,24,0.8)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 28, marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #D4A017, #F5A623, #D4A017)', opacity: 0.7,
          }} />

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, flexWrap: 'wrap', gap: 10,
          }}>
            <div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#F2EDE4',
                margin: 0, marginBottom: 4,
              }}>
                Resultados da Simulacao
              </h3>
              <div style={{ fontSize: 12, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
                {pai.nome} <span style={{ color: '#D4A017', fontWeight: 700 }}> x </span> {mae.nome}
              </div>
            </div>
            <div style={{
              background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)',
              borderRadius: 10, padding: '8px 16px',
            }}>
              <span style={{ fontSize: 11, color: '#D4A017', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                {resultados.length} fenotipos possiveis
              </span>
            </div>
          </div>

          {/* Results grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {resultados.map((r, i) => (
              <div key={i} style={{
                background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 12, padding: '18px 16px', position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                {/* Probability bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: `${r.probabilidade}%`, height: 2,
                  background: 'linear-gradient(90deg, #D4A017, #F5A623)',
                  opacity: 0.5, borderRadius: '0 2px 0 0',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{
                    fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase',
                  }}>
                    Fenotipo #{i + 1}
                  </div>
                  <div style={{
                    background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)',
                    borderRadius: 8, padding: '3px 10px',
                    fontSize: 13, fontFamily: "'DM Mono', monospace", color: '#D4A017', fontWeight: 700,
                  }}>
                    {r.probabilidade}%
                  </div>
                </div>

                <div style={{ fontSize: 14, color: '#F2EDE4', fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>
                  {r.fenotipo}
                </div>

                <div style={{
                  fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Mutacoes herdadas
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {r.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
                </div>
              </div>
            ))}
          </div>

          {/* Probability distribution bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, color: '#5A7A5C', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>
              Distribuicao de probabilidade
            </div>
            <div style={{
              display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              {resultados.map((r, i) => {
                const colors = ['#D4A017', '#5BC0EB', '#E88DB4', '#4CAF7D', '#9B8EC4', '#F5A623', '#C46A5A']
                return (
                  <div key={i} style={{
                    width: `${r.probabilidade}%`, background: colors[i % colors.length],
                    opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontFamily: "'DM Mono', monospace", color: '#0A1A0C', fontWeight: 700,
                    transition: 'opacity 0.2s', cursor: 'default',
                    borderRight: i < resultados.length - 1 ? '1px solid rgba(10,26,12,0.5)' : 'none',
                  }} title={`${r.fenotipo}: ${r.probabilidade}%`}>
                    {r.probabilidade >= 10 ? `${r.probabilidade}%` : ''}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── HISTORY TABLE ───────────────────────────────────────── */}
      {historico.length > 0 && (
        <div style={{
          background: 'rgba(21,40,24,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #7A9E7C, #5A7A5C)', opacity: 0.5,
          }} />

          <h3 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F2EDE4',
            margin: 0, marginBottom: 16,
          }}>
            Historico de Simulacoes
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Pai', 'Mae', 'Data', 'Resultados', 'Acoes'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#5A7A5C',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map(sim => (
                  <tr key={sim.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background 0.15s',
                  }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#5A7A5C', fontFamily: "'DM Mono', monospace" }}>
                      {sim.id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, color: '#F2EDE4', fontWeight: 500 }}>{sim.pai.nome}</div>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                        {sim.pai.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, color: '#F2EDE4', fontWeight: 500 }}>{sim.mae.nome}</div>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                        {sim.mae.mutacoes.map(m => <MutationBadge key={m} mutation={m} size="small" />)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#8A9E8C', fontFamily: "'DM Mono', monospace" }}>
                      {sim.data}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: 'rgba(212,160,23,0.1)', color: '#D4A017',
                        border: '1px solid rgba(212,160,23,0.25)',
                        borderRadius: 8, padding: '3px 10px',
                        fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                      }}>
                        {sim.resultados.length} fenotipos
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => setDetailSim(sim)}
                        style={{
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                          color: '#7A9E7C', borderRadius: 8, padding: '6px 14px',
                          fontSize: 11, fontFamily: "'DM Mono', monospace",
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state for history */}
      {historico.length === 0 && !animating && !resultados && (
        <div style={{
          background: 'rgba(21,40,24,0.4)', border: '1px dashed rgba(255,255,255,0.04)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>DNA</div>
          <div style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#5A7A5C', marginBottom: 6,
          }}>
            Nenhuma simulacao realizada
          </div>
          <div style={{
            fontSize: 12, color: '#4A6A4C', fontFamily: "'DM Mono', monospace", maxWidth: 380, margin: '0 auto',
          }}>
            Selecione um pai e uma mae acima e clique em "Simular Cruzamento" para ver os possiveis resultados geneticos.
          </div>
        </div>
      )}

      {/* ─── DETAIL MODAL ────────────────────────────────────────── */}
      <SimulationDetailModal sim={detailSim} onClose={() => setDetailSim(null)} />
    </div>
  )
}
