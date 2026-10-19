import { useRef, useState } from 'react'
import './Step.css'

const DOMAINS = ['Select domain', 'Banking', 'Retail', 'Insurance', 'Healthcare', 'Telecom', 'Other']

export default function StepClientDetails({ data, onChange, onNext }) {
  const [logoPreview, setLogoPreview] = useState(null)
  const fileRef = useRef()

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    onChange({ logo: file })
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    onChange({ logo: file })
    setLogoPreview(URL.createObjectURL(file))
  }

  const canNext = data.initiativeName.trim() && data.domain && data.domain !== 'Select domain'

  return (
    <div className="step-layout">
      <div className="step-left">
        <h2 className="step-title">Tell us about your Modernization Initiative</h2>
        <p className="step-subtitle">This information personalises the workspace and the dashboard.</p>

        <div className="form-group">
          <label className="form-label">Modernization Initiative <span className="req">*</span></label>
          <input
            className="form-input"
            placeholder="Enter Initiative Short Name"
            value={data.initiativeName}
            onChange={(e) => onChange({ initiativeName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Domain <span className="req">*</span></label>
          <select
            className="form-select"
            value={data.domain || 'Select domain'}
            onChange={(e) => onChange({ domain: e.target.value })}
          >
            {DOMAINS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="Optional. For example: mainframe batch and online, 3M LOC"
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            maxLength={500}
          />
          <div className="form-hint">Shown in your workspace list. 0/500</div>
        </div>
      </div>

      <div className="step-right">
        <div className="form-group">
          <label className="form-label">Client logo (optional)</label>
          <div
            className="drop-zone"
            onClick={() => fileRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {logoPreview
              ? <img src={logoPreview} alt="logo preview" className="logo-preview-img" />
              : <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p className="drop-label">Drag and drop an image here<br/>or click to browse</p>
                </>
            }
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          </div>
          <p className="form-hint">PNG, JPG or GIF, up to 2 MB</p>
        </div>

        <div className="preview-card">
          <div className="preview-label">Live preview</div>
          <div className="preview-subtext">How it will look in your dashboard</div>
          <div className="preview-row">
            {logoPreview
              ? <img src={logoPreview} alt="preview" className="preview-logo-img" />
              : <div className="preview-logo-placeholder" />
            }
            <div>
              <div className="preview-name">{data.initiativeName || 'Client name'}</div>
              <div className="preview-domain">{(data.domain && data.domain !== 'Select domain') ? data.domain : 'Domain'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="step-footer">
        <div />
        <button className="btn-next" onClick={onNext} disabled={!canNext}>
          Next →
        </button>
      </div>
    </div>
  )
}
