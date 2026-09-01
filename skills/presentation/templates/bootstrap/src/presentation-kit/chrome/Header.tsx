import type { PresentationMode, Step } from '../types'

interface HeaderProps<TPayload> {
  mode: PresentationMode
  presentationTitle: string
  step: Step<TPayload>
}

export function Header<TPayload>({ mode, presentationTitle, step }: HeaderProps<TPayload>) {
  return (
    <header data-presentation-header="true">
      <span data-presentation-marker="true">{step.era}</span>
      {mode === 'present' ? <h1 data-presentation-step-title="true">{step.title}</h1> : <p>{presentationTitle}</p>}
    </header>
  )
}
