import { useState } from 'react'
import StepClientDetails from './wizard/StepClientDetails'
import StepTechStack from './wizard/StepTechStack'
import StepSourceInfo from './wizard/StepSourceInfo'
import StepProcess from './wizard/StepProcess'
import './NewDiscovery.css'

const STEPS = [
  { id: 1, label: 'Client Details' },
  { id: 2, label: 'Tech Stack' },
  { id: 3, label: 'Source & Info' },
  { id: 4, label: 'Process' },
]

export default function NewDiscovery({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    initiativeName: '',
    domain: '',
    description: '',
    logo: null,
    techStack: [],
    sourceFile: null,
    notes: '',
    wsId: null,
  })

  const updateForm = (fields) => setFormData((prev) => ({ ...prev, ...fields }))
  const next = () => setCurrentStep((s) => Math.min(s + 1, 4))
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepClientDetails data={formData} onChange={updateForm} onNext={next} />
      case 2: return <StepTechStack data={formData} onChange={updateForm} onNext={next} onBack={back} />
      case 3: return <StepSourceInfo data={formData} onChange={updateForm} onNext={next} onBack={back} />
      case 4: return <StepProcess data={formData} onChange={updateForm} onBack={back} onComplete={onComplete} />
      default: return null
    }
  }

  return (
    <div className="new-discovery">
      {/* Stepper */}
      <div className="nd-stepper">
        {STEPS.map((step, idx) => {
          const done = currentStep > step.id
          const active = currentStep === step.id
          return (
            <div key={step.id} className="nd-step-item">
              <div className={`nd-step-circle ${done ? 'done' : active ? 'active' : ''}`}>
                {done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : step.id
                }
              </div>
              <span className={`nd-step-label ${active ? 'active' : done ? 'done' : ''}`}>{step.label}</span>
              {idx < STEPS.length - 1 && (
                <div className={`nd-step-line ${done ? 'done' : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="nd-content">
        {renderStep()}
      </div>
    </div>
  )
}
