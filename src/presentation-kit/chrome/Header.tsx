import type { ReactNode } from 'react'
import type { PresentationMode } from '../constants'
import { stepMarker } from '../steps'

export interface HeaderProps {
  index: number
  count: number
  /** Active step's one-line title, shown here in browse mode. */
  title: string
  mode: PresentationMode
  /** Host-provided brand for the top-left slot. The kit adds none by default. */
  brand?: ReactNode
}

export function Header({ index, count, title, mode, brand }: HeaderProps) {
  return (
    <header data-presentation-header="" style={{ display: 'flex', alignItems: 'center' }}>
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      <span data-presentation-marker="">{stepMarker(index, count)}</span>
      {mode === 'browse' ? <h1 data-presentation-title="" style={{ margin: 0 }}>{title}</h1> : null}
    </header>
  )
}
