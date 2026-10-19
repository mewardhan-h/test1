import { useState } from 'react'
import { login } from '../api'
import RegisterPage from './RegisterPage'
import './LoginPage.css'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  if (showRegister) {
    return <RegisterPage onLogin={onLogin} onBack={() => setShowRegister(false)} />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email.trim().toLowerCase(), password)
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

        <h2 className="login-title">Sign in to your account</h2>
        <p className="login-sub">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-group">
            <label className="login-label">Email address</label>
            <input
              className="login-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
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

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-divider" />

        <p className="login-register-text">
          Don't have an account?{' '}
          <button className="login-register-link" onClick={() => setShowRegister(true)}>
            Register
          </button>
        </p>
      </div>
    </div>
  )
}
