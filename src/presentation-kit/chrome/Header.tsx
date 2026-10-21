import type { ReactNode } from 'react'
import type { Mode } from '../types'

export interface HeaderProps {
  mode: Mode
  /** 1-based position derived from the step's index. */
  marker: number
  total: number
  title: string
  /** Host-provided brand for the top-left slot; the kit supplies none. */
  brand?: ReactNode
}

export function Header({ mode, marker, total, title, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex' }}
    >
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      <span data-presentation-marker="">
        <span data-presentation-marker-index="">{marker}</span>
        <span aria-hidden="true"> / </span>
        <span data-presentation-marker-total="">{total}</span>
      </span>
      {mode === 'browse' ? (
        <h1 data-presentation-title="">
          {title}
        </h1>
      ) : null}
    </header>
  )
}
