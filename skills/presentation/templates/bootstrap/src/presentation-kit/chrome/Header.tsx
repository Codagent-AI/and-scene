import type { ReactNode } from 'react'
import type { Mode } from '../types.ts'

export interface HeaderProps {
  title: string
  mode: Mode
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ title, mode, brand, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div data-presentation-brand="">{brand}</div>
      {mode === 'browse' ? <h1 data-presentation-title="">{title}</h1> : <span />}
      <button
        type="button"
        data-presentation-mode-toggle=""
        aria-label={mode === 'browse' ? 'Switch to present mode' : 'Switch to browse mode'}
        onClick={(e) => {
          onToggleMode()
          if (e.detail > 0) e.currentTarget.blur()
        }}
      >
        {mode === 'browse' ? 'present' : 'browse'}
      </button>
    </header>
  )
}
