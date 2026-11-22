import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ step, index, title, mode, brand, toggle }: { step: StepMeta; index: number; title: string; mode: Mode; brand?: ReactNode; toggle: () => void }) {
  return <header data-presentation-header="">
    {brand && <div data-presentation-brand="">{brand}</div>}
    <span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>
    {mode === 'browse' && <span data-presentation-title="">{title}</span>}
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
