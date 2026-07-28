import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

export interface HeaderProps {
  mode: PresentationMode
  marker: string
  title: string
  /** Host-opt-in top-left brand slot. The kit renders no default brand here. */
  brand?: ReactNode
}

export function Header({ mode, marker, title, brand }: HeaderProps) {
  return (
    <header data-presentation-header="" data-presentation-mode={mode}>
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      <span data-presentation-marker="">{marker}</span>
      {mode === 'browse' ? <span data-presentation-header-title="">{title}</span> : null}
    </header>
  )
}
