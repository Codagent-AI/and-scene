import type { ReactNode } from 'react'
import type { Mode } from '../types'

export interface HeaderProps {
  mode: Mode
  deckTitle: string
  marker: string
  brand?: ReactNode
}

export function Header({ mode, deckTitle, marker, brand }: HeaderProps) {
  return (
    <header data-presentation-header="" style={{ display: 'flex', alignItems: 'center' }}>
      <div data-presentation-brand="">{brand}</div>
      <p data-presentation-marker="">{marker}</p>
      {mode === 'browse' ? <p data-presentation-deck-title="">{deckTitle}</p> : null}
    </header>
  )
}
