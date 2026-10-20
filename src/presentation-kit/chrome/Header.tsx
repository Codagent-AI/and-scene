import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from '../constants.ts'
import { stepNumber } from '../geometry.ts'
import type { Mode, StepMeta } from '../types.ts'

export interface HeaderProps {
  step: StepMeta
  index: number
  mode: Mode
  title: string
  /** Host-provided branding for the top-left slot; empty by default. */
  brand?: ReactNode
}

export function Header({ step, index, mode, title, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: STAGE_LAYOUT[mode].top,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <span data-presentation-marker="">
        {stepNumber(index)} · {step.era}
      </span>
      {mode === 'browse' ? <span data-presentation-deck-title="">{title}</span> : null}
    </header>
  )
}
