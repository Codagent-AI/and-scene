import type { ReactNode } from 'react'
import type { PresentationMode, StepMeta } from '../types'
export function Header({ title, step, index, mode, brand }: { title: string; step: StepMeta; index: number; mode: PresentationMode; brand?: ReactNode }) {
  return <header data-presentation-header="true">
    <div>{brand}</div><div data-presentation-marker="true">{step.era} · {String(index + 1).padStart(2, '0')}</div>
    {mode === 'browse' && <h1 data-presentation-title="true">{title}</h1>}
  </header>
}
