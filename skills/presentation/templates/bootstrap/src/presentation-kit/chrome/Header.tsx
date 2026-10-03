import type { ReactNode } from 'react'
import type { PresentationMode } from '../constants'
import type { StepMeta } from '../types'
import { stepNumber } from '../stepNumber'

interface HeaderProps {
  mode: PresentationMode
  step: StepMeta
  index: number
  count: number
  title: string
  /** Host-provided brand; the kit renders none by default. */
  brand?: ReactNode
}

export function Header({ mode, step, index, count, title, brand }: HeaderProps) {
  return (
    <header
      className="presentation-header"
      data-presentation-header=""
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div className="presentation-brand" data-presentation-brand="">
        {brand}
      </div>
      {mode === 'browse' && (
        <h1 className="presentation-deck-title" data-presentation-deck-title="">
          {title}
        </h1>
      )}
      <div className="presentation-marker" data-presentation-marker="">
        <span data-presentation-marker-number="">
          {stepNumber(index)} / {stepNumber(count - 1)}
        </span>{' '}
        <span data-presentation-marker-era="">{step.era}</span>
      </div>
    </header>
  )
}
