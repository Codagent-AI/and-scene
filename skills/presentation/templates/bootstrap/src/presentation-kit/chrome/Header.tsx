import type { ReactNode } from 'react'
import { stepNumber } from '../stepNumber'
import type { Mode } from '../types'

export interface HeaderProps {
  title: string
  mode: Mode
  index: number
  count: number
  era: string
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ title, mode, index, count, era, brand, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="" data-presentation-chrome="" style={{ display: 'flex' }}>
      {brand !== undefined && brand !== null && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="" data-presentation-era={era}>
        {stepNumber(index)} / {count}
      </span>
      {mode === 'browse' && <span data-presentation-title="">{title}</span>}
      <button
        type="button"
        data-presentation-mode-toggle=""
        aria-label={mode === 'present' ? 'Switch to browse mode' : 'Switch to present mode'}
        onClick={onToggleMode}
      >
        {mode === 'present' ? 'browse' : 'present'}
      </button>
    </header>
  )
}
