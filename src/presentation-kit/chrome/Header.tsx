import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ step, index, mode, brand, toggleMode }: { step: StepMeta; index: number; mode: Mode; brand?: ReactNode; toggleMode: () => void }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between' }}>
    <div>{brand}<span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>{mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}</div>
    <button data-presentation-mode-toggle="" onClick={toggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'} <span aria-hidden="true">↗</span></button>
  </header>
}
