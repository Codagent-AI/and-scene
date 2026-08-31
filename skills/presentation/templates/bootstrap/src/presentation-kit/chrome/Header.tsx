import type { PresentationMode, Step } from '../types'

interface HeaderProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  mode: PresentationMode
  title: string
}

export function Header<TPayload>({ step, stepIndex, mode, title }: HeaderProps<TPayload>) {
  const marker = `${String(stepIndex + 1).padStart(2, '0')} · ${step.era}`
  return (
    <header data-presentation-header data-presentation-mode={mode}>
      {mode === 'present' ? (
        <>
          <span data-presentation-marker>{marker}</span>
          <span data-presentation-present-title>{step.title}</span>
        </>
      ) : (
        <>
          <span data-presentation-title>{title}</span>
          <span data-presentation-marker>{marker}</span>
        </>
      )}
    </header>
  )
}
