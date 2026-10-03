import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'

export interface HeaderProps {
  mode: Mode
  title: string
  activeStep: StepMeta
  /** Host-provided top-left brand slot; the kit renders no default brand here. */
  brand?: ReactNode
}

export function Header({ mode, title, activeStep, brand }: HeaderProps) {
  return (
    <header className="and-scene-header" data-presentation-header="" data-presentation-mode={mode}>
      <div className="and-scene-brand-slot" data-presentation-brand-slot="">
        {brand}
      </div>
      {mode === 'present' ? (
        <div className="and-scene-marker" data-presentation-marker="">
          <span className="and-scene-era" data-presentation-era="">
            {activeStep.era}
          </span>
          <span className="and-scene-title" data-presentation-title="">
            {activeStep.title}
          </span>
        </div>
      ) : (
        <div className="and-scene-title" data-presentation-title="">
          {title}
        </div>
      )}
    </header>
  )
}
