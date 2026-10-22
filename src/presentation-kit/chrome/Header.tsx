import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from '../constants.ts'
import type { Mode } from '../types.ts'

export interface HeaderProps {
  mode: Mode
  /** Order-derived step number (1-based). */
  number: number
  era: string
  /** Shown in browse mode only; present mode shows it in the footer. */
  title: string
  /** Host-provided brand for the top-left slot. */
  brand?: ReactNode
}

export function Header({ mode, number, era, title, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: STAGE_LAYOUT[mode].top }}
    >
      {brand !== undefined && brand !== null ? <div data-presentation-brand="">{brand}</div> : null}
      <div data-presentation-marker="">
        <span data-presentation-number="">{number}</span>
        <span data-presentation-era="">{era}</span>
      </div>
      {mode === 'browse' ? <h1 data-presentation-title="">{title}</h1> : null}
    </header>
  )
}
