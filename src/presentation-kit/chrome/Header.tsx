import type { Step, PresentationMode } from '../types'
export function Header<T>({ title, step, index, mode, onToggleMode }: { title: string; step: Step<T>; index: number; mode: PresentationMode; onToggleMode: () => void }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-marker" data-presentation-marker="">{step.era} · {String(index + 1).padStart(2, '0')}</div>
    {mode === 'browse' ? <h1 className="presentation-title" data-presentation-title="">{title}</h1> : <h1 className="presentation-title presentation-title-step" data-presentation-step-title="">{step.title}</h1>}
    <button type="button" className="presentation-mode-toggle" data-presentation-mode-toggle="" onClick={onToggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
