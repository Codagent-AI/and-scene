import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ step, index, mode, brand, toggle }: { step: StepMeta; index: number; mode: Mode; brand?: ReactNode; toggle: () => void }) {
  return <header data-presentation-header=""><div>{brand}<span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>{mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}</div><button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button></header>
}
