import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

export function Header({ title, step, mode, brand }: { title: string; step: { era: string; title: string; number: number }; mode: PresentationMode; brand?: ReactNode }) {
  return <header className="presentation-header" data-presentation-header>
    <div className="presentation-header-brand" data-presentation-brand>{brand}</div>
    <div className="presentation-header-marker" data-presentation-marker>{step.era} · {String(step.number).padStart(2, '0')}</div>
    {mode === 'browse' && <h1 className="presentation-header-title" data-presentation-title>{title}: {step.title}</h1>}
  </header>
}
