import { useRef, useState } from 'react'
import { createWorkspace, uploadFile, processWorkspace } from '../../api'
import './Step.css'

export default function StepSourceInfo({ data, onChange, onNext, onBack }) {
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = (file) => {
    if (file) onChange({ sourceFile: file })
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      // 1. Create workspace
      setUploadProgress('Creating workspace…')
      const ws = await createWorkspace({
        client_name: data.initiativeName,
        domain: data.domain,
        description: data.description || '',
        tech_stack: data.techStack,
        notes: data.notes || '',
        info_type: '',
        info_link: '',
      })

      // 2. Upload logo if provided
      if (data.logo) {
        setUploadProgress('Uploading logo…')
        await uploadFile(ws.id, 'logo', data.logo)
      }

      // 3. Upload ZIP
      setUploadProgress('Uploading source code…')
      await uploadFile(ws.id, 'source', data.sourceFile)

      // 4. Trigger processing
      setUploadProgress('Starting analysis…')
      await processWorkspace(ws.id)

      // 5. Move to process step with ws_id
      onChange({ wsId: ws.id })
      onNext()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="step-layout">
      <div className="step-left">
        <h2 className="step-title">Upload source code</h2>
        <p className="step-subtitle">Upload the client source code as one ZIP file. It is unpacked into this workspace and analysed.</p>

        <div className="form-group">
          <label className="form-label">Source code <span className="req">*</span></label>
          <div
            className={`drop-zone large ${dragging ? 'dragging' : ''}`}
            onClick={() => !submitting && fileRef.current.click()}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
          >
            {data.sourceFile
              ? <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <p className="drop-label" style={{ color: '#16a34a' }}>{data.sourceFile.name}</p>
                  <p className="drop-hint">{(data.sourceFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </>
              : <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <p className="drop-label">Drag and drop your ZIP file here<br/>or click to browse</p>
                  <p className="drop-hint">Only zip files, up to 5 GB</p>
                </>
            }
            <input ref={fileRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          <p className="form-hint">The ZIP is extracted into your workspace and analysed with the technologies you selected.</p>
        </div>
      </div>

      <div className="step-right">
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Anything that helps the analysis: environment, scope, known issues..."
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={5}
            maxLength={1000}
            disabled={submitting}
          />
          <div className="form-hint">{(data.notes || '').length}/1000</div>
        </div>
      </div>

      {error && (
        <div style={{ gridColumn: '1 / -1', background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {error}
        </div>
      )}

      {submitting && (
        <div style={{ gridColumn: '1 / -1', background: '#eff2ff', color: '#3b5bdb', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {uploadProgress}
        </div>
      )}

      <div className="step-footer">
        <button className="btn-back" onClick={onBack} disabled={submitting}>← Back</button>
        <button className="btn-next" onClick={handleSubmit} disabled={!data.sourceFile || submitting}>
          {submitting ? 'Please wait…' : 'Start Processing →'}
        </button>
      </div>
    </div>
  )
}
