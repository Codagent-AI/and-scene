import type { ReactNode } from 'react'
import type { PresentationMode } from '../constants'
import type { StepMeta } from '../types'

export interface HeaderProps {
  step: StepMeta
  index: number
  count: number
  mode: PresentationMode
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: ReactNode
  title?: string
}

export function Header({ step, index, count, mode, brand, title }: HeaderProps) {
  return (
    <header
      data-presentation-header
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
    >
      <div data-presentation-brand-slot>{brand}</div>
      <span aria-hidden="true" style={{ flexGrow: 1 }} />
      <div data-presentation-marker>
        {title ? <span data-presentation-deck-title>{title}</span> : null}
        <span data-presentation-step-number>{index + 1}</span>
        <span data-presentation-step-total>{count}</span>
        <span data-presentation-era>{step.era}</span>
      </div>
      {mode === 'browse' ? <h1 data-presentation-title style={{ flexBasis: '100%' }}>{step.title}</h1> : null}
    </header>
  )
}
