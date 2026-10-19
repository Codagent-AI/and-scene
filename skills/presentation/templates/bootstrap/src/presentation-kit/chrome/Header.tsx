import type { ReactNode } from 'react'
import type { Mode } from '../constants.ts'
import type { StepMeta } from '../types.ts'

export interface HeaderProps {
  step: StepMeta
  index: number
  count: number
  mode: Mode
  brand?: ReactNode
  onToggleMode: () => void
}

/** Marker row; the title joins it in browse mode. The start slot is empty unless the host passes a brand. */
export function Header({ step, index, count, mode, brand, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="" style={{ position: 'fixed', left: 0, right: 0, top: 0 }}>
      <div data-presentation-header-start="">{brand}</div>
      <div data-presentation-marker="">
        <span data-presentation-marker-number="">{index + 1} / {count}</span>
        <span data-presentation-marker-era=""> {step.era}</span>
      </div>
      {mode === 'browse' ? <h1 data-presentation-title="">{step.title}</h1> : null}
      <button type="button" data-presentation-mode-toggle="" aria-pressed={mode === 'present'} onClick={onToggleMode}>
        {mode === 'present' ? 'Browse' : 'Present'}
      </button>
    </header>
  )
}
