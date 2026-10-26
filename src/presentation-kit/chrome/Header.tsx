import type { ReactNode } from 'react'
import type { StepMeta } from '../types'
export function Header({ step, index, title, brand, toggle, mode }: { step: StepMeta; index: number; title: string; brand?: ReactNode; toggle: () => void; mode: string }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 24, right: 24 }}>
    {brand && <div data-presentation-brand="">{brand}</div>}
    <div data-presentation-document-title="">{title}</div>
    <div data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {step.era}</div>
    {mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
