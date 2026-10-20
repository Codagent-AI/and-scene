import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from '../constants.ts'
import type { Mode, StepMeta } from '../types.ts'

export interface HeaderProps {
  brand?: ReactNode
  step: StepMeta
  index: number
  mode: Mode
  onToggleMode: () => void
}

export function Header({ brand, step, index, mode, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: STAGE_LAYOUT[mode].top }}>
      <div data-presentation-brand="">{brand}</div>
      <div data-presentation-marker="">
        <span data-presentation-number="">{String(index + 1).padStart(2, '0')}</span>
        <span data-presentation-era="">{step.era}</span>
      </div>
      <button type="button" data-presentation-mode-toggle="" aria-pressed={mode === 'present'} onClick={onToggleMode}>
        {mode === 'present' ? 'Browse' : 'Present'}
      </button>
    </header>
  )
}
