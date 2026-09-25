import type { PresentationMode, StepMeta } from '../types'

export function Header({ title, step, index, total, mode, brand }: { title: string; step: StepMeta; index: number; total: number; mode: PresentationMode; brand?: React.ReactNode }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-header__brand" data-presentation-brand="">{brand}</div>
    <div className="presentation-header__marker" data-presentation-marker=""><span>{step.era}</span><span data-presentation-step-number="">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
    {mode === 'browse' && <h1 className="presentation-header__title" data-presentation-title="">{title}</h1>}
  </header>
}
