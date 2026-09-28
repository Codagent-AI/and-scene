import type { ReactNode } from 'react'
import type { Mode, Step } from '../types'

export interface HeaderProps<TPayload> {
  mode: Mode
  title: string
  activeStep: Step<TPayload>
  /** Host-provided top-left brand slot; the kit renders no default brand here. */
  brand?: ReactNode
}

export function Header<TPayload>({ mode, title, activeStep, brand }: HeaderProps<TPayload>) {
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
