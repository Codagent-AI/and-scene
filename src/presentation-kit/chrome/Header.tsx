import type { ReactNode } from 'react'
import type { Mode } from '../types.ts'

interface HeaderProps {
  /** Host-provided brand; the kit renders no default brand. */
  brand?: ReactNode
  mode: Mode
  title: string
  era: string
  /** Zero-based position of the active step. */
  index: number
  total: number
  onToggleMode: () => void
}

export function Header({ brand, mode, title, era, index, total, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div data-presentation-brand="">{brand}</div>
      {mode === 'browse' ? (
        <h1 data-presentation-title="" style={{ margin: 0 }}>
          {title}
        </h1>
      ) : null}
      <div data-presentation-header-end="" style={{ display: 'flex', alignItems: 'center' }}>
        <span data-presentation-marker="">
          {index + 1} / {total}
        </span>
        <span data-presentation-era="">{era}</span>
        <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
          {mode === 'browse' ? 'Present' : 'Browse'}
        </button>
      </div>
    </header>
  )
}
