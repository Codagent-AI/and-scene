import type { ReactNode } from 'react'
import type { Mode, SceneStep } from '../types'

export interface HeaderProps {
  step: SceneStep
  index: number
  count: number
  mode: Mode
  brand?: ReactNode
}

export function Header({ step, index, count, mode, brand }: HeaderProps) {
  return (
    <header data-presentation-header="">
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      <div data-presentation-marker="">
        <span data-presentation-step-number="">
          {index + 1} / {count}
        </span>{' '}
        <span data-presentation-era="">{step.era}</span>
      </div>
      {mode === 'browse' ? <h1 data-presentation-title="">{step.title}</h1> : null}
    </header>
  )
}
