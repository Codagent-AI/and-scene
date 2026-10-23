import type { HTMLAttributes, ReactNode } from 'react'
import type { Mode } from '../types'

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  mode: Mode
  deckTitle: string
  /** Host-supplied branding. The kit renders no brand by default. */
  brand?: ReactNode
}

/** Top row: host branding, plus the deck title in browse mode. */
export function Header({ mode, deckTitle, brand, style, ...rest }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      {...rest}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto', ...style }}
    >
      <div data-presentation-brand="" style={{ display: 'flex', alignItems: 'center' }}>
        {brand}
      </div>
      {mode === 'browse' ? <h1 data-presentation-deck-title="">{deckTitle}</h1> : null}
    </header>
  )
}
