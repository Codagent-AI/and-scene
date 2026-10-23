import type { ReactNode } from 'react'
import type { Mode } from '../types'

export interface HeaderProps {
  brand?: ReactNode
  marker: string
  era: string
  mode: Mode
  onToggleMode: () => void
}

export function Header({ brand, marker, era, mode, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <div data-presentation-marker-row="" style={{ display: 'flex', alignItems: 'center' }}>
        <span data-presentation-marker="">{marker}</span>
        <span data-presentation-era="">{era}</span>
      </div>
      <button type="button" data-presentation-mode-toggle="" data-presentation-mode={mode} onClick={onToggleMode}>
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
