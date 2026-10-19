import type { CSSProperties, ReactNode } from 'react'
import type { Mode } from '../types'
import { dataHooks, type DataHooks } from '../nodes/geometry'

interface HeaderProps extends DataHooks {
  className?: string
  style?: CSSProperties
  mode: Mode
  marker: string
  title: string
  /** Host-provided brand for the top-left slot; empty by default. */
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ mode, marker, title, brand, onToggleMode, className, style, ...hooks }: HeaderProps) {
  return (
    <header {...dataHooks(hooks)} data-presentation-header="" className={className} style={style}>
      <div data-presentation-brand="">{brand}</div>
      {mode === 'browse' ? <h1 data-presentation-deck-title="">{title}</h1> : null}
      <span data-presentation-marker="">{marker}</span>
      <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
