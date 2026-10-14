import type { ReactNode } from 'react'
import type { Mode } from '../types'
import { stepNumber } from '../usePresentationNav'

interface HeaderProps {
  mode: Mode
  title: string
  index: number
  count: number
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ mode, title, index, count, brand, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
    >
      {brand != null && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="">
        {stepNumber(index)} / {count}
      </span>
      {mode === 'browse' && <span data-presentation-deck-title="">{title}</span>}
      <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
        {mode === 'present' ? 'Browse' : 'Present'}
      </button>
    </header>
  )
}
