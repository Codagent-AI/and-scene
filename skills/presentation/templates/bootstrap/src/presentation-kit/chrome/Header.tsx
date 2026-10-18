import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'

interface HeaderProps {
  mode: Mode
  step: StepMeta
  index: number
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ mode, step, index, brand, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}
    >
      <div data-presentation-brand="">{brand}</div>
      <div data-presentation-marker="">
        <span data-presentation-marker-number="">{index + 1}</span>
        <span data-presentation-era="">{step.era}</span>
      </div>
      {mode === 'browse' && <h2 data-presentation-title="">{step.title}</h2>}
      <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
        {mode === 'present' ? 'browse' : 'present'}
      </button>
    </header>
  )
}
