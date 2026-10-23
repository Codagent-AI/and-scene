import type { ReactNode } from 'react'
import { STAGE_LAYOUT, type Mode } from '../constants'
import { formatStepNumber } from '../eras'
import type { StepMeta } from '../types'

export interface HeaderProps {
  step: StepMeta
  index: number
  mode: Mode
  /** Host-provided branding for the top-left slot; nothing is rendered by default. */
  brand?: ReactNode
}

export function Header({ step, index, mode, brand }: HeaderProps) {
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
        gap: 16,
        paddingInline: STAGE_LAYOUT[mode].side,
        boxSizing: 'border-box',
      }}
    >
      {brand != null && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="">
        <span data-presentation-marker-number="">{formatStepNumber(index)}</span>{' '}
        <span data-presentation-marker-era="">{step.era}</span>
      </span>
      {mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
    </header>
  )
}
