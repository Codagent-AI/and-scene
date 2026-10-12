import type { ReactNode } from 'react'
import type { PresentationMode, StepMeta } from '../types'
export function Header({ title, mode, step, brand }: { title: string; mode: PresentationMode; step: StepMeta; brand?: ReactNode }) {
  return <header data-presentation-header>{brand && <div data-presentation-brand>{brand}</div>}{mode === 'browse' && <h1>{title}</h1>}{mode === 'present' && <div data-presentation-marker>{step.era}</div>}</header>
}
