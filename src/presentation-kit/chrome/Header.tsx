import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ step, index, mode, title, brand }: { step: StepMeta; index: number; mode: Mode; title: string; brand?: ReactNode }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 24, left: 24, right: 150 }}>{brand && <div data-presentation-brand="">{brand}</div>}<span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</span>{mode === 'browse' && <p data-presentation-title="">{title}</p>}{mode === 'browse' && <h1 data-presentation-step-title="">{step.title}</h1>}</header>
}
