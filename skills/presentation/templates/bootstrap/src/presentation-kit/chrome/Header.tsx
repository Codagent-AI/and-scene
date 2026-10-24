import type { ReactNode } from 'react'
import type { Mode } from '../constants'

/** Top row: optional host brand on the left (opt-in) and the presentation title. */
export function Header({ brand, title, mode }: { brand?: ReactNode; title: string; mode: Mode }) {
  return (
    <header
      data-presentation-chrome="header"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      {mode === 'browse' && <div data-presentation-deck-title="">{title}</div>}
    </header>
  )
}
