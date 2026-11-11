import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ title, step, index, mode, brand }: { title: string; step: StepMeta; index: number; mode: Mode; brand?: ReactNode }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 24, left: 28, right: 28 }}>
    {brand && <div data-presentation-brand="">{brand}</div>}
    <div data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</div>
    {mode === 'browse' && <><div data-presentation-name="">{title}</div><h1 data-presentation-title="">{step.title}</h1></>}
  </header>
}
