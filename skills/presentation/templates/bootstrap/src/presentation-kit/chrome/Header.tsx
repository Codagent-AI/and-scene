import type { PresentationMode, Step } from '../types'

export function Header<TPayload>({ title, mode, step, index, count, brand, toggleMode }: { title: string; mode: PresentationMode; step: Step<TPayload>; index: number; count: number; brand?: React.ReactNode; toggleMode: () => void }) {
  return (
    <header className="presentation-header" data-presentation-header="">
      <div className="presentation-header-brand" data-presentation-brand-slot="">{brand}</div>
      <div className="presentation-marker" data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</div>
      {mode === 'browse' && <div className="presentation-header-title" data-presentation-title="">{title}</div>}
      <span className="presentation-era" data-presentation-era="">{step.era}</span>
      <button type="button" onClick={toggleMode} aria-label={mode === 'browse' ? 'Present mode' : 'Browse mode'} data-presentation-mode-toggle="">{mode === 'browse' ? 'Present' : 'Browse'}</button>
    </header>
  )
}
