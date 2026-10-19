import { useState } from 'react'
import './LoginPage.css'

const BASE = 'http://localhost:8000'

async function register(fullName, email, password) {
  const res = await fetch(BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, email, password }),
  })
  if (!res.ok) {
    let msg = res.statusText
    try { msg = (await res.json()).detail || msg } catch (_) {}
    throw new Error(msg)
  }
  return res.json()
}

export default function RegisterPage({ onLogin, onBack }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const data = await register(fullName.trim(), email.trim().toLowerCase(), password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-dot" />
          <span className="login-logo-text">Discovery Platform</span>
        </div>

        <h2 className="login-title">Create an account</h2>
        <p className="login-sub">Fill in the details below to get started</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-group">
            <label className="login-label">Full name</label>
            <input
              className="login-input"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="login-group">
            <label className="login-label">Email address</label>
            <input
              className="login-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-group">
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="login-group">
            <label className="login-label">Confirm password</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <div className="login-divider" />

        <p className="login-register-text">
          Already have an account?{' '}
          <button className="login-register-link" onClick={onBack}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
