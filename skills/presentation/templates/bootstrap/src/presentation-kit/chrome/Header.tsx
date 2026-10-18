import type { ReactNode } from 'react'
import { STAGE_LAYOUT, type Mode } from '../constants'
import { stepNumber } from '../steps'
import type { AnyStep } from '../types'

export interface HeaderProps {
  step: AnyStep
  index: number
  mode: Mode
  /** Host-provided top-left branding. The kit renders no default brand. */
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ step, index, mode, brand, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-chrome="header"
      style={{
        height: STAGE_LAYOUT[mode].top,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <div data-presentation-marker="" data-presentation-era={step.era}>
        <span data-presentation-marker-number="">{stepNumber(index)}</span>
        <span data-presentation-marker-era="">{step.era}</span>
      </div>
      <h1
        data-presentation-title=""
        style={{ flex: '1 1 0', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {step.title}
      </h1>
      <button
        type="button"
        data-presentation-mode-toggle=""
        aria-label={mode === 'browse' ? 'Switch to present mode' : 'Switch to browse mode'}
        onClick={onToggleMode}
      >
        {mode === 'browse' ? 'present' : 'browse'}
      </button>
    </header>
  )
}
