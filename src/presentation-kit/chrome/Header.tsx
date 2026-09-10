import type { PresentationMode, Step } from '../types'

interface HeaderProps<TPayload> {
  step: Step<TPayload>
  mode: PresentationMode
  onToggleMode: () => void
}

export function Header<TPayload>({ step, mode, onToggleMode }: HeaderProps<TPayload>) {
  const nextMode = mode === 'browse' ? 'present' : 'browse'
  return <header className="presentation-header" data-presentation-header>
    <span data-presentation-marker>{step.era}</span>
    <h1 data-presentation-title>{step.title}</h1>
    <button type="button" onClick={onToggleMode} aria-label={`Switch to ${nextMode} mode`} data-presentation-mode-toggle>{mode}</button>
  </header>
}
