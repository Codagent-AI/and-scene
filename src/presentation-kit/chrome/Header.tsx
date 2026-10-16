import type { ReactNode } from 'react'
import type { Mode } from '../types'

interface HeaderProps {
  mode: Mode
  marker: string
  era: string
  title: string
  brand?: ReactNode
}

export function Header({ mode, marker, era, title, brand }: HeaderProps) {
  return (
    <header data-presentation-header="" data-presentation-mode={mode}>
      {brand !== undefined && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="">{marker}</span>
      <span data-presentation-era="">{era}</span>
      {mode === 'browse' && <h1 data-presentation-title="">{title}</h1>}
    </header>
  )
}
