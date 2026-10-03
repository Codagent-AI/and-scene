import type { ReactNode } from 'react'
import type { PresentationMode, Step } from '../types'

export interface HeaderProps {
  title: string
  mode: PresentationMode
  activeStep: Step
  brand?: ReactNode
  onToggleMode: () => void
}

/**
 * Present mode: marker + one-line step title. Browse mode: same step title,
 * plus the deck title. No default top-left and-scene brand — `brand` is a
 * host opt-in slot.
 */
export function Header({ title, mode, activeStep, brand, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="" data-presentation-mode={mode}>
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      {mode === 'browse' ? <p data-presentation-deck-title="">{title}</p> : null}
      <p data-presentation-marker="" data-presentation-era={activeStep.era}>
        {activeStep.era}
      </p>
      <h1 data-presentation-step-title="">{activeStep.title}</h1>
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
