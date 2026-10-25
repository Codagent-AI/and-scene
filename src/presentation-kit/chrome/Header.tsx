import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ mode, step, index, brand }: { mode: Mode; step: StepMeta; index: number; brand?: ReactNode }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
    {brand && <div data-presentation-brand="">{brand}</div>}
    <span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>
    {mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
  </header>
}
