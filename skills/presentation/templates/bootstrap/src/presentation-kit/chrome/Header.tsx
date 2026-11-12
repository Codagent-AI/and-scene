import type { ReactNode } from 'react'
import type { StepMeta } from '../types'
export function Header({ step, index, title, brand }: { step: StepMeta; index: number; title: string; brand?: ReactNode }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
    {brand && <div data-presentation-brand="">{brand}</div>}
    <div data-presentation-name="">{title}</div>
    <span data-presentation-marker="">{index + 1} / {step.era}</span>
    <h1 data-presentation-title="">{step.title}</h1>
  </header>
}
