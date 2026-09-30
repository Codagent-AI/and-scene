import type { ReactNode } from 'react'
import type { PresentationMode, Step } from '../types'

interface HeaderProps<TPayload> {
  step: Step<TPayload>
  mode: PresentationMode
  brand?: ReactNode
}

export function Header<TPayload>({ step, mode, brand }: HeaderProps<TPayload>) {
  return (
    <header data-presentation-header data-presentation-mode={mode}>
      {brand ? <div data-presentation-brand>{brand}</div> : null}
      <span data-presentation-marker>{step.era}</span>
      {mode === 'browse' ? <h1 data-presentation-title>{step.title}</h1> : null}
    </header>
  )
}
