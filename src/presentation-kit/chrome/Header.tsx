import type { PresentationMode, Step } from '../types'

type HeaderProps<TPayload> = { mode: PresentationMode; step: Step<TPayload>; title: string }

export function Header<TPayload>({ mode, step, title }: HeaderProps<TPayload>) {
  return (
    <header data-presentation-header="true">
      {mode === 'present' ? (
        <>
          <span data-presentation-marker="true">{step.era}</span>
          <span data-presentation-present-title="true">{step.title}</span>
        </>
      ) : <h1 data-presentation-title="true">{title}</h1>}
    </header>
  )
}
