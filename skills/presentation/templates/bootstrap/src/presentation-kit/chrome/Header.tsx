import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ title, step, index, mode, brand, toggleMode }: { title: string; step: StepMeta; index: number; mode: Mode; brand?: ReactNode; toggleMode: () => void }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
    {brand}<span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>
    <h1 data-presentation-title="">{mode === 'browse' ? title : step.title}</h1>
    <button data-presentation-mode-toggle="" onClick={toggleMode} aria-label="Toggle presentation mode">{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
