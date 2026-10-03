import type { Step, PresentationMode } from '../types'

type HeaderProps<TPayload> = { title: string; mode: PresentationMode; step: Step<TPayload>; onToggleMode: () => void }

export function Header<TPayload>({ title, mode, step, onToggleMode }: HeaderProps<TPayload>) {
  return (
    <header className="presentation-header" data-presentation-header>
      <div className="presentation-header__brand" data-presentation-brand aria-hidden="true" />
      <div className="presentation-header__marker" data-presentation-marker>{step.era}</div>
      {mode === 'browse' && <h1 className="presentation-header__title">{title}</h1>}
      <button className="presentation-header__mode-toggle" data-presentation-mode-toggle type="button" onClick={onToggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
