import type { PresentationMode, Step } from '../types'
export function Header<T>({ title, mode, step, index, brand, onToggle }: { title: string; mode: PresentationMode; step: Step<T>; index: number; brand?: React.ReactNode; onToggle: () => void }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-brand">{brand}</div>
    {mode === 'present' ? <div className="presentation-marker" data-presentation-marker="">{step.era} · {String(index + 1).padStart(2, '0')}</div> : <h1 className="presentation-title">{title}</h1>}
    <button type="button" className="presentation-mode-toggle" onClick={onToggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
