import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from '../constants.ts'
import type { Mode } from '../types.ts'

interface HeaderProps {
  mode: Mode
  deckTitle: string
  /** 1-based, derived from position. */
  marker: number
  count: number
  /** Host-provided branding; the kit supplies none by default. */
  brand?: ReactNode
}

export function Header({ mode, deckTitle, marker, count, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: STAGE_LAYOUT[mode].top,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      {mode === 'browse' && <h1 data-presentation-deck-title="">{deckTitle}</h1>}
      <span data-presentation-marker="" aria-label={`Step ${marker} of ${count}`}>
        {marker}
        <span data-presentation-marker-total="">/{count}</span>
      </span>
    </header>
  )
}
