import type { ReactNode } from 'react'
import type { PresentationMode, StepMeta } from '../types.ts'

type HeaderProps = {
  title: string
  step: StepMeta
  stepCount: number
  mode: PresentationMode
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ title, step, stepCount, mode, brand, onToggleMode }: HeaderProps) {
  return (
    <header className="presentation-header" data-presentation-header>
      <div className="presentation-header-brand" data-presentation-brand>
        {brand}
      </div>
      <div className="presentation-header-marker" data-presentation-marker>
        {String(step.index + 1).padStart(2, '0')} / {String(stepCount).padStart(2, '0')}
      </div>
      {mode === 'browse' ? (
        <>
          <h1 data-presentation-title>{title}</h1>
          <p data-presentation-step-title>{step.title}</p>
        </>
      ) : <p data-presentation-title>{step.title}</p>}
      <button
        type="button"
        className="presentation-mode-toggle"
        data-presentation-mode-toggle
        aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}
        onClick={onToggleMode}
      >
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
