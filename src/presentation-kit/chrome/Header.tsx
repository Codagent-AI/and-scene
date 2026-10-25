import type { ReactNode } from 'react'
import type { Mode } from '../types.ts'

interface HeaderProps {
  mode: Mode
  title: string
  number: number
  count: number
  era: string
  /** Host-provided brand; the kit renders no default brand. */
  brand?: ReactNode
}

export function Header({ mode, title, number, count, era, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto' }}
    >
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      <div data-presentation-marker="">
        <span data-presentation-number="">
          {number} / {count}
        </span>{' '}
        <span data-presentation-era="">{era}</span>
      </div>
      {mode === 'browse' ? <div data-presentation-title="">{title}</div> : null}
    </header>
  )
}
