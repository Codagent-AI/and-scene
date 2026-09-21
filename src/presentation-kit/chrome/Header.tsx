import type { PresentationMode, Step } from '../types'

export function Header<TPayload>({ step, index, mode, title }: { step: Step<TPayload>; index: number; mode: PresentationMode; title: string }) {
  return (
    <header data-presentation-header data-presentation-mode={mode}>
      <div data-presentation-marker aria-label={`Step ${index + 1}`}>{String(index + 1).padStart(2, '0')}</div>
      {mode === 'browse' ? <div data-presentation-title>{title} · {step.title}</div> : <div data-presentation-present-title>{step.title}</div>}
    </header>
  )
}
