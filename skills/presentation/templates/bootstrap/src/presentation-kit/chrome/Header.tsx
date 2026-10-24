import type { ReactNode } from 'react'
import type { Mode } from '../constants'
import type { StepMeta } from '../types'

interface HeaderProps {
  mode: Mode
  index: number
  count: number
  step: StepMeta
  brand?: ReactNode
}

const pad = (n: number) => String(n).padStart(2, '0')

export function Header({ mode, index, count, step, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', flex: '0 0 auto' }}
    >
      {brand !== undefined && <div data-presentation-brand="">{brand}</div>}
      <div data-presentation-marker="">
        <span data-presentation-marker-number="">
          {pad(index + 1)} / {pad(count)}
        </span>{' '}
        <span data-presentation-marker-era="">{step.era}</span>
      </div>
      {mode === 'browse' && (
        <h1 data-presentation-step-title="" style={{ flex: '1 1 0', minWidth: 0 }}>
          {step.title}
        </h1>
      )}
    </header>
  )
}
