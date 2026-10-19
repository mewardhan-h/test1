import { useState } from 'react'
import ExistingDiscovery from '../components/ExistingDiscovery'
import NewDiscovery from '../components/NewDiscovery'
import './IngestPage.css'

export default function IngestPage({ user }) {
  const [activeTab, setActiveTab] = useState('existing')

  return (
    <div className="ingest-page">
      <div className="ingest-tabs">
        <button
          className={`ingest-tab ${activeTab === 'existing' ? 'active' : ''}`}
          onClick={() => setActiveTab('existing')}
        >
          Existing
        </button>
        <button
          className={`ingest-tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          New
        </button>
      </div>

      <div className="ingest-body">
        {activeTab === 'existing'
          ? <ExistingDiscovery user={user} onNewDiscovery={() => setActiveTab('new')} />
          : <NewDiscovery onComplete={() => setActiveTab('existing')} />
        }
      </div>
    </div>
  )
}
