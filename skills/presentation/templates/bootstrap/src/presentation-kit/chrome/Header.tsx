import type { ReactNode } from 'react'
import { stepNumber } from '../steps.ts'
import type { Mode, StepMeta } from '../types.ts'

interface HeaderProps {
  step: StepMeta
  index: number
  mode: Mode
  title: string
  /** Host-provided branding for the top-left slot; the kit renders none by default. */
  brand?: ReactNode
}

export function Header({ step, index, mode, title, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <span data-presentation-marker="">
        <span data-presentation-marker-number="">{String(stepNumber(index)).padStart(2, '0')}</span>{' '}
        <span data-presentation-marker-era="">{step.era}</span>
      </span>
      {mode === 'browse' && (
        <span data-presentation-deck-title="" style={{ marginLeft: 'auto' }}>
          {title}
        </span>
      )}
    </header>
  )
}
