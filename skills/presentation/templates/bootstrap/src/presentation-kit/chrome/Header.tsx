import type { ReactNode } from 'react'
import type { PresentationMode, StepMeta } from '../types'

export function Header({ step, index, count, mode, brand, title }: {
  step: StepMeta; index: number; count: number; mode: PresentationMode; brand?: ReactNode; title: string
}) {
  return <header aria-label={title} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
    <div data-presentation-brand>{brand}</div>
    <span data-presentation-marker>{index + 1} / {count}</span>
    {mode === 'browse' && <>
      <span data-presentation-era>{step.era}</span>
      <h1 data-presentation-title>{step.title}</h1>
    </>}
  </header>
}
