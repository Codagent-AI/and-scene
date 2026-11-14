import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ step, index, count, mode, brand, toggle }: { step: StepMeta; index: number; count: number; mode: Mode; brand?: ReactNode; toggle: () => void }) {
  return <header data-presentation-header="" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div data-presentation-brand="">{brand}</div>
    <div data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')} · {step.era}</div>
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
