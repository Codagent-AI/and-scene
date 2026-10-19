import type { ReactNode } from 'react'
import type { Mode } from '../types'

interface HeaderProps {
  mode: Mode
  marker: string
  title: string
  /** Host-provided brand for the top-left slot; empty by default. */
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ mode, marker, title, brand, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="">
      <div data-presentation-brand="">{brand}</div>
      {mode === 'browse' ? <h1 data-presentation-deck-title="">{title}</h1> : null}
      <span data-presentation-marker="">{marker}</span>
      <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
