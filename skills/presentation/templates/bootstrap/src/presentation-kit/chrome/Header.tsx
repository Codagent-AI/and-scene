import type { ReactNode } from 'react'
import type { Mode } from '../constants.ts'
import { stepNumber } from '../steps.ts'

interface HeaderProps {
  mode: Mode
  deckTitle: string
  era: string
  index: number
  count: number
  brand?: ReactNode
}

export function Header({ mode, deckTitle, era, index, count, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header
      style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center' }}
    >
      {brand ? <div data-presentation-brand>{brand}</div> : null}
      <span data-presentation-marker data-presentation-era={era}>
        {String(stepNumber(index)).padStart(2, '0')} / {String(count).padStart(2, '0')} · {era}
      </span>
      {mode === 'browse' ? (
        <h1 data-presentation-deck-title style={{ marginLeft: 'auto' }}>{deckTitle}</h1>
      ) : null}
    </header>
  )
}
