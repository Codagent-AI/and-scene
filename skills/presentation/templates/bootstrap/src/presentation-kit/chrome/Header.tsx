import type { ReactNode } from 'react'
import type { PresentationMode } from '../types.ts'

interface HeaderProps {
  brand?: ReactNode
  title: string
  era: string
  index: number
  count: number
  mode: PresentationMode
}

const pad = (n: number) => String(n).padStart(2, '0')

export function Header({ brand, title, era, index, count, mode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      {mode === 'browse' && <div data-presentation-deck-title="">{title}</div>}
      <div data-presentation-marker="">
        <span data-presentation-marker-number="">{pad(index + 1)}</span>
        <span data-presentation-marker-total="">{`/ ${pad(count)}`}</span>
        <span data-presentation-era="">{era}</span>
      </div>
    </header>
  )
}
