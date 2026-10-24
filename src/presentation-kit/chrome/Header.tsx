import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from '../constants'
import type { Mode, StepMeta } from '../types'

export interface HeaderProps {
  mode: Mode
  index: number
  step: StepMeta
  brand?: ReactNode
}

export function Header({ mode, index, step, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      data-presentation-chrome="header"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: mode === 'browse' ? STAGE_LAYOUT.browse.insetTop / 2 : STAGE_LAYOUT.present.insetTop,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div data-presentation-brand="">{brand}</div>
      <div data-presentation-marker="">
        <span data-presentation-marker-number="">{index + 1}</span>
        <span data-presentation-marker-era="">{step.era}</span>
      </div>
      {mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
    </header>
  )
}
