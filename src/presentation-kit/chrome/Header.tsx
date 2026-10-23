import type { ReactNode } from 'react'
import { CHROME, type Mode } from '../constants'

export interface HeaderProps {
  mode: Mode
  index: number
  count: number
  era: string
  title: string
  /** Host-provided brand; the kit adds none. */
  brand?: ReactNode
}

export function Header({ mode, index, count, era, title, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: CHROME.headerH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div data-presentation-brand>{brand}</div>
      {mode === 'browse' && <h1 data-presentation-title>{title}</h1>}
      <div data-presentation-marker>
        <span data-presentation-step-number>{index + 1}</span>
        <span data-presentation-step-total>{count}</span>
        <span data-presentation-era>{era}</span>
      </div>
    </header>
  )
}
