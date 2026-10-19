import { useEffect, useState, useCallback } from 'react'
import { listWorkspaces, openWorkspace } from '../api'
import './ExistingDiscovery.css'

const STATUS_OPTIONS = ['All Statuses', 'Completed', 'Running', 'Extracting', 'Analysing', 'Failed', 'Created']

const statusConfig = {
  Completed:  { color: '#16a34a', bg: '#dcfce7' },
  Running:    { color: '#d97706', bg: '#fef9c3' },
  Extracting: { color: '#d97706', bg: '#fef9c3' },
  Analysing:  { color: '#2563eb', bg: '#dbeafe' },
  Failed:     { color: '#dc2626', bg: '#fee2e2' },
  Created:    { color: '#64748b', bg: '#f1f5f9' },
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { color: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {status}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch (_) { return iso }
}

export default function ExistingDiscovery({ user, onNewDiscovery }) {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [opening, setOpening] = useState(null)

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await listWorkspaces()
      setWorkspaces(data.workspaces || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchWorkspaces() }, [fetchWorkspaces])

  // Poll every 3 seconds when any workspace is active
  useEffect(() => {
    const hasActive = workspaces.some((w) =>
      ['Extracting', 'Analysing', 'Running'].includes(w.status)
    )
    if (!hasActive) return
    const timer = setInterval(fetchWorkspaces, 3000)
    return () => clearInterval(timer)
  }, [workspaces, fetchWorkspaces])

  const handleOpen = async (ws) => {
    if (ws.status !== 'Completed') return
    setOpening(ws.id)
    try {
      await openWorkspace(ws.id)
      // TODO: navigate to dashboard view when ready
      alert('Workspace opened: ' + ws.id)
    } catch (err) {
      alert('Could not open workspace: ' + err.message)
    } finally {
      setOpening(null)
    }
  }

  const filtered = workspaces.filter((ws) => {
    const q = search.toLowerCase()
    const matchSearch = ws.id.toLowerCase().includes(q) ||
      ws.client_name.toLowerCase().includes(q) ||
      ws.domain.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All Statuses' || ws.status === statusFilter
    return matchSearch && matchStatus
  })

  const total     = workspaces.length
  const completed = workspaces.filter((w) => w.status === 'Completed').length
  const running   = workspaces.filter((w) => ['Running', 'Extracting', 'Analysing'].includes(w.status)).length
  const failed    = workspaces.filter((w) => w.status === 'Failed').length

  return (
    <div className="existing-discovery">
      {/* Header */}
      <div className="ed-header">
        <div>
          <h1 className="ed-title">Your Discovery Workspaces</h1>
          <p className="ed-subtitle">Open an existing workspace or start a new discovery</p>
        </div>
        <div className="ed-header-actions">
          <span className="ed-user">
            <span className="ed-avatar">{user?.full_name?.[0]?.toUpperCase() || 'A'}</span>
            {user?.full_name || 'Admin'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="ed-controls">
        <div className="ed-search-wrap">
          <svg className="ed-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="ed-search"
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="ed-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="ed-new-btn" onClick={onNewDiscovery}>+ New Discovery</button>
        <button className="ed-refresh-btn" onClick={fetchWorkspaces} title="Refresh">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Stat cards */}
      <div className="ed-stats">
        <div className="ed-stat-card total">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <div><div className="stat-label">Total workspaces</div><div className="stat-value">{total}</div></div>
        </div>
        <div className="ed-stat-card completed">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          <div><div className="stat-label">Completed</div><div className="stat-value">{completed}</div></div>
        </div>
        <div className="ed-stat-card running">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div><div className="stat-label">Running</div><div className="stat-value">{running}</div></div>
        </div>
        <div className="ed-stat-card failed">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div><div className="stat-label">Failed</div><div className="stat-value">{failed}</div></div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="ed-error">{error}</div>}

      {/* Table */}
      <div className="ed-table-wrap">
        {loading
          ? <div className="ed-loading">Loading workspaces…</div>
          : (
          <table className="ed-table">
            <thead>
              <tr>
                <th>Workspace ID</th>
                <th>Client</th>
                <th>Description</th>
                <th>Status</th>
                <th>Last Run</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} className="ed-empty">No workspaces found</td></tr>
                : filtered.map((ws) => (
                  <tr key={ws.id}>
                    <td className="ws-id">{ws.id}</td>
                    <td>
                      <div className="ws-client">{ws.client_name}</div>
                      <div className="ws-category">{ws.domain}</div>
                    </td>
                    <td className="ws-desc">{ws.description || '—'}</td>
                    <td>
                      <div>
                        <StatusBadge status={ws.status} />
                        {['Extracting', 'Analysing', 'Running'].includes(ws.status) && (
                          <div className="ws-progress-bar">
                            <div className="ws-progress-fill" style={{ width: (ws.progress || 0) + '%' }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="ws-date">{formatDate(ws.last_run_at || ws.created_at)}</td>
                    <td>
                      <button
                        className={`ws-view-btn ${ws.status !== 'Completed' ? 'disabled' : ''}`}
                        onClick={() => handleOpen(ws)}
                        disabled={ws.status !== 'Completed' || opening === ws.id}
                        title={ws.status !== 'Completed' ? 'Available when analysis completes' : 'Open workspace'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {opening === ws.id ? 'Opening…' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      <div className="ed-footer">Showing {filtered.length} of {total} workspaces</div>
    </div>
  )
}
