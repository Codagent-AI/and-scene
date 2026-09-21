import type { ReactNode } from 'react'
import type { PresentationMode, StepMeta } from '../types'

export function Header({ mode, title, step, brand }: { mode: PresentationMode; title: string; step: StepMeta; brand?: ReactNode }) {
  return <header data-presentation-header="true">
    <div data-presentation-brand="true">{brand}</div>
    <div data-presentation-marker="true" aria-label={`Step ${step.id}`}>{step.era}</div>
    {mode === 'browse' ? <><p data-presentation-deck-title="true">{title}</p><h1 data-presentation-title="true">{step.title}</h1></> : <h1 data-presentation-title="true">{step.title}</h1>}
  </header>
}
