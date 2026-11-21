import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
import { ReservedText } from './ReservedText'

export function Header({ mode, steps, index, brand }: {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  brand?: ReactNode
}) {
  const step = steps[index]
  const count = steps.length
  return <header data-presentation-header="">
    {brand && <div data-presentation-brand="">{brand}</div>}
    <div data-presentation-marker="">
      <span data-presentation-era="">{step.era}</span>
      <span data-presentation-number="" aria-label={`Step ${index + 1} of ${count}`}>
        {index + 1} / {count}
      </span>
    </div>
    {mode === 'browse' && <h1 data-presentation-step-title="">
      <ReservedText text={step.title} choices={steps.map(item => item.title)} />
    </h1>}
  </header>
}
