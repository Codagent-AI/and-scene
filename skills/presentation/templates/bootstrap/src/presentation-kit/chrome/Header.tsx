import type { ReactNode } from 'react'
import { formatStepNumber } from '../steps'
import type { Mode, StepMeta } from '../types'

interface HeaderProps {
  step: StepMeta
  index: number
  count: number
  mode: Mode
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ step, index, count, mode, brand, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header>
      <div data-presentation-brand-slot>{brand}</div>
      <span data-presentation-marker>
        <span data-presentation-marker-number>{formatStepNumber(index, count)}</span>
        <span data-presentation-marker-era>{step.era}</span>
      </span>
      <button
        type="button"
        data-presentation-mode-toggle
        data-presentation-mode={mode}
        aria-pressed={mode === 'present'}
        onClick={onToggleMode}
      >
        {mode === 'present' ? 'Browse' : 'Present'}
      </button>
    </header>
  )
}
