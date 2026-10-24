import type { HTMLAttributes, ReactNode } from 'react'
import type { Mode } from '../types.ts'

export interface HeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Host-provided branding for the top-left slot; empty by default. */
  brand?: ReactNode
  marker: string
  /** Shown in browse mode only. */
  title?: string
  mode: Mode
  onToggleMode: () => void
  height: number
}

export function Header({ brand, marker, title, mode, onToggleMode, height, style, ...rest }: HeaderProps) {
  const target = mode === 'browse' ? 'present' : 'browse'
  return (
    <header
      data-presentation-header=""
      {...rest}
      style={{ flex: 'none', height, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', ...style }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <span data-presentation-marker="">{marker}</span>
      {title !== undefined && <h2 data-presentation-title="">{title}</h2>}
      <button type="button" data-presentation-mode-toggle={mode} aria-label={`Switch to ${target} mode`} onClick={onToggleMode}>
        {target}
      </button>
    </header>
  )
}
