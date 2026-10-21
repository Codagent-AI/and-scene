import type { ReactNode } from 'react'
import { HEADER_HEIGHT } from '../constants'

export interface HeaderProps {
  brand?: ReactNode
  number: number
  era: string
}

/** Top row: the host's optional brand on the left, step marker on the right. */
export function Header({ brand, number, era }: HeaderProps) {
  return (
    <header
      data-presentation-header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div data-presentation-brand-slot>{brand}</div>
      <div data-presentation-marker>
        <span data-presentation-step-number>{number}</span>{' '}
        <span data-presentation-era>{era}</span>
      </div>
    </header>
  )
}
