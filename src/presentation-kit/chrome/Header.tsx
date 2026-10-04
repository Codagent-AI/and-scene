import type { PresentationMode, Step } from '../types'

export function Header<TPayload>({ mode, title, step, index, brand }: { mode: PresentationMode; title: string; step: Step<TPayload>; index: number; brand?: React.ReactNode }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-header-brand">{brand}</div>
    <div className="presentation-header-marker" data-presentation-marker="">
      <span className="presentation-era">{step.era}</span><span className="presentation-number">{String(index + 1).padStart(2, '0')}</span>
    </div>
    {mode === 'browse' && <h1 className="presentation-header-title">{title}</h1>}
  </header>
}
