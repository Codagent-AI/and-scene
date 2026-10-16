import type { ReactNode } from 'react'
import type { AnyStep, PresentationMode } from '../types'

export interface HeaderProps {
  step: AnyStep
  mode: PresentationMode
  /** Host-provided brand; the kit renders no default brand. */
  brand?: ReactNode
}

export function Header({ step, mode, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <div data-presentation-era="">{step.era}</div>
      {mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
    </header>
  )
}
