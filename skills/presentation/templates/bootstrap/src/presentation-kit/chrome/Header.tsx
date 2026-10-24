import type { ReactNode } from 'react'
import { stepNumber } from '../model.ts'
import type { Mode, StepMeta } from '../types.ts'
import type { SlotProps } from './slots.ts'

export interface HeaderProps {
  step: StepMeta
  index: number
  mode: Mode
  deckTitle?: string
  /** Host-provided brand for the top-left slot; nothing is rendered by default. */
  brand?: ReactNode
  onToggleMode: () => void
  slot?: SlotProps
  toggleSlot?: SlotProps
}

export function Header({ step, index, mode, deckTitle, brand, onToggleMode, slot, toggleSlot }: HeaderProps) {
  return (
    <header
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto' }}
      {...slot}
      data-presentation-header=""
    >
      <div data-presentation-header-start="">
        {brand !== undefined && brand !== null ? <span data-presentation-brand="">{brand}</span> : null}
      </div>
      <div data-presentation-header-middle="">
        <span data-presentation-marker="" data-presentation-era={step.era}>
          {stepNumber(index)}
        </span>
        {mode === 'browse' ? <h1 data-presentation-title="">{step.title}</h1> : null}
        {deckTitle ? <span data-presentation-deck-title="">{deckTitle}</span> : null}
      </div>
      <div data-presentation-header-end="">
        <button type="button" onClick={onToggleMode} {...toggleSlot} data-presentation-mode-toggle="" data-presentation-mode={mode}>
          {mode === 'browse' ? 'Present' : 'Browse'}
        </button>
      </div>
    </header>
  )
}
