import type { PresentationMode, Step } from '../types'

interface HeaderProps<TPayload> {
  mode: PresentationMode
  step: Step<TPayload>
}

export function Header<TPayload>({ mode, step }: HeaderProps<TPayload>) {
  return (
    <header data-presentation-header="true">
      <span data-presentation-marker="true">{step.era}</span>
      {mode === 'browse' ? <h1 data-presentation-title="true">{step.title}</h1> : null}
    </header>
  )
}
