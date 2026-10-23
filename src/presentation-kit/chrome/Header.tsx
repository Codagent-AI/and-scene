import type { ReactNode } from 'react'
import type { Mode } from '../types'
import { headerStyle } from '../layout'

export interface HeaderProps {
  brand?: ReactNode
  number: number
  total: number
  era: string
  title: string
  mode: Mode
  onToggleMode: () => void
}

/** Top row: optional host brand, step marker, deck title in browse mode, mode toggle. */
export function Header({ brand, number, total, era, title, mode, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="" style={headerStyle}>
      <div data-presentation-brand="">{brand}</div>
      <p data-presentation-marker="">
        <span data-presentation-marker-number="">{`${number} / ${total}`}</span>{' '}
        <span data-presentation-marker-era="">{era}</span>
      </p>
      {mode === 'browse' ? <p data-presentation-deck-title="">{title}</p> : null}
      <button
        type="button"
        data-presentation-mode-toggle=""
        aria-pressed={mode === 'present'}
        onClick={onToggleMode}
      >
        {mode === 'present' ? 'Browse' : 'Present'}
      </button>
    </header>
  )
}
