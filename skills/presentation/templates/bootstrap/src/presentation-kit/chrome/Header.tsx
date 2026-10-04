import type { PresentationMode } from '../types'
export function Header({ title, mode, section, index, brand }: { title: string; mode: PresentationMode; section: string; index: number; brand?: React.ReactNode }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-header-brand" data-presentation-brand="">{brand}</div>
    {mode === 'browse' && <h1 className="presentation-header-title" data-presentation-title="">{title}</h1>}
    <span className="presentation-step-marker" data-presentation-marker="">{section} · {String(index + 1).padStart(2, '0')}</span>
  </header>
}
