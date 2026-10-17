import type { ReactNode } from 'react'
import type { Mode } from '../types.ts'

interface HeaderProps {
  title?: string
  mode: Mode
  brand?: ReactNode
}

/** Top row: host-provided brand slot (empty by default) and the presentation title in browse mode. */
export function Header({ title, mode, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      data-presentation-chrome=""
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto' }}
    >
      <div data-presentation-brand="">{brand}</div>
      {mode === 'browse' && title ? <div data-presentation-deck-title="">{title}</div> : null}
    </header>
  )
}
