import type { PresentationMode, StepMeta } from '../types'
export function Header({ title, step, index, mode, brand }: { title: string; step: StepMeta; index: number; mode: PresentationMode; brand?: React.ReactNode }) {
  return <header className="presentation-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} data-presentation-header="">
    <div className="presentation-header-brand">{brand}</div>
    <div className="presentation-marker" data-presentation-marker="">{step.era} · {String(index + 1).padStart(2, '0')}</div>
    {mode === 'browse' && <div className="presentation-header-title">{title}</div>}
  </header>
}
