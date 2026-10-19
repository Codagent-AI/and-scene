import type { ReactNode } from 'react'
import { stepNumber } from '../eras'
import type { Mode, StepMeta } from '../types'

export interface HeaderProps {
  step: StepMeta
  index: number
  count: number
  mode: Mode
  /** Host-provided brand; the kit renders no default brand. */
  brand?: ReactNode
  modeToggle: ReactNode
}

export function Header({ step, index, count, mode, brand, modeToggle }: HeaderProps) {
  return (
    <header data-presentation-header="" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div data-presentation-brand="">{brand}</div>
      <span data-presentation-marker="">{stepNumber(index, count)}</span>
      {mode === 'browse' ? <h1 data-presentation-title="">{step.title}</h1> : null}
      <div style={{ marginLeft: 'auto' }}>{modeToggle}</div>
    </header>
  )
}
