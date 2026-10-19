import { useEffect, useRef, useState } from 'react'
import { getStatus } from '../../api'
import './Step.css'

const STATE_COLORS = {
  done:    { bg: '#dcfce7', color: '#16a34a', border: '#16a34a' },
  active:  { bg: '#dbeafe', color: '#2563eb', border: '#2563eb' },
  failed:  { bg: '#fee2e2', color: '#dc2626', border: '#dc2626' },
  pending: { bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0' },
}

export default function StepProcess({ data, onBack, onComplete }) {
  const wsId = data.wsId
  const [status, setStatus] = useState(null)
  const [logLines, setLogLines] = useState([])
  const [error, setError] = useState('')
  const sinceRef = useRef(0)
  const logRef = useRef()
  const timerRef = useRef()

  const poll = async () => {
    try {
      const res = await getStatus(wsId, sinceRef.current)
      setStatus(res)
      if (res.log?.length) {
        setLogLines((prev) => [...prev, ...res.log])
        sinceRef.current = res.last_seq
      }
      setError('')
      if (res.status === 'Completed' || res.status === 'Failed') {
        clearInterval(timerRef.current)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!wsId) return
    poll()
    timerRef.current = setInterval(poll, 1500)
    return () => clearInterval(timerRef.current)
  }, [wsId])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logLines])

  const isDone = status?.status === 'Completed'
  const isFailed = status?.status === 'Failed'

  return (
    <div className="step-layout" style={{ gridTemplateColumns: '1fr' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <h2 className="step-title">
          {isDone ? '✅ Analysis Complete' : isFailed ? '❌ Analysis Failed' : '⚙️ Processing…'}
        </h2>
        <p className="step-subtitle">
          {isDone
            ? 'Your workspace is ready to open.'
            : isFailed
            ? 'Something went wrong. Check the log below.'
            : 'Your source code is being analysed. This may take a few minutes.'}
        </p>

        {/* Progress bar */}
        {status && (
          <div className="process-progress-wrap">
            <div className="process-progress-bar">
              <div
                className="process-progress-fill"
                style={{
                  width: (status.progress || 0) + '%',
                  background: isFailed ? '#dc2626' : isDone ? '#16a34a' : '#3b5bdb',
                }}
              />
            </div>
            <span className="process-progress-pct">{status.progress || 0}%</span>
          </div>
        )}

        {/* Pipeline steps */}
        {status?.steps?.length > 0 && (
          <div className="process-steps">
            {status.steps.map((s) => {
              const cfg = STATE_COLORS[s.state] || STATE_COLORS.pending
              return (
                <div key={s.id} className="process-step-item" style={{ borderColor: cfg.border, background: cfg.bg }}>
                  <span style={{ color: cfg.color, fontWeight: 600, fontSize: 13 }}>{s.label}</span>
                  <span style={{ color: cfg.color, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.state}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary on completion */}
        {isDone && status?.summary && (
          <div className="process-summary">
            <div className="process-summary-item">
              <span className="psi-label">Components</span>
              <span className="psi-value">{status.summary.components?.toLocaleString() || '—'}</span>
            </div>
            <div className="process-summary-item">
              <span className="psi-label">Programs</span>
              <span className="psi-value">{status.summary.programs?.toLocaleString() || '—'}</span>
            </div>
            <div className="process-summary-item">
              <span className="psi-label">Lines of Code</span>
              <span className="psi-value">{status.summary.loc || '—'}</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {(isFailed || error) && (
          <div className="process-error">
            {status?.error || error}
          </div>
        )}

        {/* Live log */}
        <div className="process-log-wrap">
          <div className="process-log-title">Live log</div>
          <div className="process-log" ref={logRef}>
            {logLines.length === 0
              ? <span className="process-log-empty">Waiting for output…</span>
              : logLines.map((line, i) => (
                <div key={line.seq ?? i} className={`log-line log-${(line.level || 'INFO').toLowerCase()}`}>
                  <span className="log-ts">{(line.ts || '').replace('T', ' ').replace('Z', '')}</span>
                  <span className="log-level">{line.level || 'INFO'}</span>
                  <span className="log-msg">{line.message}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="step-footer" style={{ gridColumn: '1 / -1' }}>
        <button className="btn-back" onClick={onBack} disabled={!isFailed && !isDone}>
          ← Back
        </button>
        {isDone && (
          <button className="btn-next" onClick={onComplete}>
            Go to Workspaces →
          </button>
        )}
      </div>
    </div>
  )
}
