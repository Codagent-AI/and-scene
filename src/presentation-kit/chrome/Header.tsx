import type { ReactNode } from 'react'
import type { StepMeta } from '../types'
export function Header({ step, index, title, browse, brand, toggle }: { step: StepMeta; index: number; title: string; browse: boolean; brand?: ReactNode; toggle: () => void }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
    {brand && <div data-presentation-brand="">{brand}</div>}
    <span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>
    {browse && <span data-presentation-name="">{title}</span>}
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label="Toggle presentation mode">{browse ? 'Present' : 'Browse'}</button>
  </header>
}
