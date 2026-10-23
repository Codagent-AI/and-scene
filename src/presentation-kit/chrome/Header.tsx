import type { ReactNode } from 'react'
import type { PresentationMode, StepMeta } from '../types'
import { stepMarker } from './helpers'

export interface HeaderProps {
  step: StepMeta
  index: number
  count: number
  mode: PresentationMode
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ step, index, count, mode, brand, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="">
      {brand !== undefined && brand !== null && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="">{stepMarker(index, count)}</span>
      <span data-presentation-era="">{step.era}</span>
      {mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
      <button
        type="button"
        data-presentation-mode-toggle=""
        aria-pressed={mode === 'present'}
        onClick={onToggleMode}
      >
        {mode === 'present' ? 'Browse' : 'Present'}
      </button>
    </header>
  )
}
