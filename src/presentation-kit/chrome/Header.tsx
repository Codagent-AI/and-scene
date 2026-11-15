import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ step, index, mode, brand }: { step: StepMeta; index: number; mode: Mode; brand?: ReactNode }) {
  return <header data-presentation-header=""><div data-presentation-brand="">{brand}</div><span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>{mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}</header>
}
