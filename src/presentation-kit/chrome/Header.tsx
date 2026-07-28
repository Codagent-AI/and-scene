import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

export interface HeaderProps {
  mode: PresentationMode
  era: string
  title: string
  stepIndex: number
  stepCount: number
  brand?: ReactNode
}

export function Header({ mode, era, title, stepIndex, stepCount, brand }: HeaderProps) {
  return (
    <header data-testid="presentation-header" data-presentation-chrome="header">
      {brand ? <div data-presentation-chrome="brand-slot">{brand}</div> : null}
      <span data-presentation-node="marker" aria-label={`step ${stepIndex + 1} of ${stepCount}`}>
        {era}
      </span>
      {mode === 'browse' ? <h1 data-presentation-node="step-title">{title}</h1> : null}
    </header>
  )
}
