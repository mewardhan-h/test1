import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import IngestPage from './pages/IngestPage'
import LoginPage from './pages/LoginPage'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch (_) { return null }
  })
  const [activePage, setActivePage] = useState('ingest')

  // Listen for 401 auto-logout from api.js
  useEffect(() => {
    const handle = () => setUser(null)
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [])

  if (!user) {
    return <LoginPage onLogin={(u) => setUser(u)} />
  }

  const renderPage = () => {
    switch (activePage) {
      case 'ingest': return <IngestPage user={user} />
      default: return <div className="empty-page" />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} user={user} onLogout={() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
