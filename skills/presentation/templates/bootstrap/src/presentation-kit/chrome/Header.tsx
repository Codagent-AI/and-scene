import type { PresentationMode, Step } from '../types'

interface HeaderProps<TPayload> {
  mode: PresentationMode
  step: Step<TPayload>
}

export function Header<TPayload>({ mode, step }: HeaderProps<TPayload>) {
  return (
    <header data-presentation-header>
      {mode === 'present' ? <span data-presentation-marker>{step.era}</span> : <h1 data-presentation-title>{step.title}</h1>}
      {mode === 'present' ? <span data-presentation-presenter-title>{step.title}</span> : null}
    </header>
  )
}
