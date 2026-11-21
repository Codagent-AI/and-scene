import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

interface HeaderProps {
  title: string
  mode: PresentationMode
  brand?: ReactNode
  index: number
  count: number
  toggleMode: () => void
}

export function Header({ title, mode, brand, index, count, toggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {brand != null && <div data-presentation-brand="">{brand}</div>}
      {mode === 'browse' && <h1 data-presentation-title="">{title}</h1>}
      <span data-presentation-marker="" aria-label={`Step ${index + 1} of ${count}`}>{index + 1} / {count}</span>
      <button type="button" data-presentation-mode-toggle="" onClick={toggleMode}>
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
