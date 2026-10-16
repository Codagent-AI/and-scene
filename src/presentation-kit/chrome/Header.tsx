import type { ReactNode } from 'react'
import type { Mode } from '../types'
import { Stacked } from './Stacked'

interface HeaderProps {
  mode: Mode
  marker: string
  era: string
  titles: readonly string[]
  index: number
  brand?: ReactNode
}

export function Header({ mode, marker, era, titles, index, brand }: HeaderProps) {
  return (
    <header data-presentation-header="" data-presentation-mode={mode}>
      {brand !== undefined && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="">{marker}</span>
      <span data-presentation-era="">{era}</span>
      {mode === 'browse' && <Stacked texts={titles} active={index} hook="data-presentation-title" as="h1" />}
    </header>
  )
}
