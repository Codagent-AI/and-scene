import type { ReactNode } from 'react'
import { stepMarker } from '../navigation'
import type { Mode } from '../types'

interface HeaderProps {
  mode: Mode
  index: number
  title: string
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ mode, index, title, brand, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header
      style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}
    >
      {brand ? <div data-presentation-brand>{brand}</div> : null}
      <span data-presentation-marker>{stepMarker(index)}</span>
      {mode === 'browse' ? <span data-presentation-deck-title>{title}</span> : null}
      <button
        type="button"
        data-presentation-mode-toggle
        style={{ marginLeft: 'auto' }}
        aria-label={mode === 'browse' ? 'Switch to present mode' : 'Switch to browse mode'}
        onClick={onToggleMode}
      >
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
