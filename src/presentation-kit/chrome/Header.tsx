import type { ReactNode } from 'react'
import type { PresentationMode, Step } from '../types'

type HeaderProps<TPayload> = {
  title: string
  step: Step<TPayload>
  mode: PresentationMode
  start?: ReactNode
}

export function Header<TPayload>({ title, step, mode, start }: HeaderProps<TPayload>) {
  return (
    <header data-presentation-header="true">
      {start ? <div data-presentation-header-start="true">{start}</div> : null}
      {mode === 'present' ? (
        <div data-presentation-present-heading="true">
          <span data-presentation-marker="true">{step.era}</span>
          <span>{step.title}</span>
        </div>
      ) : <h1 data-presentation-title="true">{title}</h1>}
    </header>
  )
}
