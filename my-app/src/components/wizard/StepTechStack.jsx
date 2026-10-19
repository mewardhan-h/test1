import { useEffect, useState } from 'react'
import { getTechStack } from '../../api'
import './Step.css'

const ICON_MAP = {
  languages: '⌨', databases: '🗄', reporting: '📊', schedulers: '🕐',
  transaction: '🔄', messaging: '📡', middleware: '🔧', other: '📦',
}
const COLOR_MAP = {
  languages: '#6366f1', databases: '#0ea5e9', reporting: '#f59e0b',
  schedulers: '#10b981', transaction: '#8b5cf6', messaging: '#ec4899',
  middleware: '#f97316', other: '#64748b',
}

export default function StepTechStack({ data, onChange, onNext, onBack }) {
  const [tabs, setTabs] = useState([])
  const [domains, setDomains] = useState([])
  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTechStack()
      .then((res) => {
        setTabs(res.tabs || [])
        setDomains(res.domains || [])
        if (res.tabs?.length) setActiveTab(res.tabs[0].id)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const selected = new Set(data.techStack)

  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange({ techStack: [...next] })
  }

  const toggleCollapse = (catId) =>
    setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }))

  const currentTab = tabs.find((t) => t.id === activeTab)

  const filteredCats = (currentTab?.categories || []).map((cat) => ({
    ...cat,
    items: (cat.items || []).filter((i) =>
      i.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0)

  const selectedLabels = tabs.flatMap((t) =>
    t.categories.flatMap((c) =>
      c.items.filter((i) => selected.has(i.id)).map((i) => ({ id: i.id, label: i.label }))
    )
  )

  return (
    <div className="step-layout tech-layout">
      <div className="step-left tech-left">
        <h2 className="step-title">Select the technology stack to analyse</h2>
        <p className="step-subtitle">Choose what exists in the client estate. Selections from both tabs are kept in one basket.</p>

        {loading && <p className="form-hint">Loading technologies…</p>}
        {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}

        {!loading && !error && (
          <>
            <div className="tech-tabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`tech-tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >{t.label}</button>
              ))}
            </div>

            <input
              className="form-input"
              style={{ marginBottom: 16 }}
              placeholder="Search technologies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="tech-categories">
              {filteredCats.map((cat) => {
                const icon = ICON_MAP[cat.id] || ICON_MAP.other
                const color = COLOR_MAP[cat.id] || COLOR_MAP.other
                return (
                  <div key={cat.id} className="tech-category">
                    <div className="tech-cat-header" onClick={() => toggleCollapse(cat.id)}>
                      <span className="tech-cat-icon" style={{ color }}>{icon}</span>
                      <span className="tech-cat-name">{cat.label}</span>
                      <span className="tech-cat-count">{cat.items.length} items</span>
                      <span className="tech-cat-chevron">{collapsed[cat.id] ? '▲' : '▼'}</span>
                    </div>
                    {!collapsed[cat.id] && (
                      <div className="tech-items">
                        {cat.items.map((item) => (
                          <label key={item.id} className="tech-item">
                            <input
                              type="checkbox"
                              checked={selected.has(item.id)}
                              onChange={() => toggle(item.id)}
                            />
                            <span className="tech-item-name">{item.label}</span>
                            {!item.parser_available && (
                              <span className="tech-item-tag">No parser yet</span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="step-right tech-right">
        <div className="selection-panel">
          <div className="selection-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>Your Selection</span>
            <span className="selection-count">{selected.size}</span>
          </div>

          {selected.size === 0
            ? <p className="selection-empty">Nothing selected yet. Tick the technologies that exist in the estate.</p>
            : (
              <div className="selection-chips">
                {selectedLabels.map(({ id, label }) => (
                  <span key={id} className="selection-chip">
                    {label}
                    <button onClick={() => toggle(id)}>×</button>
                  </span>
                ))}
              </div>
            )
          }

          <div className="parser-info">
            <strong>Parsers to be used: {selected.size}</strong>
            <p>Selected technologies decide which parsers run during the analysis.</p>
          </div>

          <button className="btn-next" style={{ width: '100%' }} onClick={onNext} disabled={selected.size === 0}>
            Continue to Source Upload →
          </button>
          <button className="btn-back" style={{ width: '100%', marginTop: 8 }} onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
