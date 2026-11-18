import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'

export function Header({ step, index, mode, brand, toggleMode }: { step: StepMeta, index: number, mode: Mode, brand?: ReactNode, toggleMode: () => void }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
    {brand && <div data-presentation-brand="">{brand}</div>}
    <div data-presentation-marker=""><span data-presentation-step-number="">{String(index + 1).padStart(2, '0')}</span><span data-presentation-era="">{step.era}</span></div>
    {mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
    <button type="button" data-presentation-mode-toggle="" aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`} onClick={toggleMode}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
