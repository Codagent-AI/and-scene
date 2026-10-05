import type { PresentationMode } from '../types'
export function Header({ title, mode, index }: { title: string; mode: PresentationMode; index: number }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-header__marker" data-presentation-marker="">{String(index + 1).padStart(2, '0')}</div>
    {mode === 'browse' && <h1 className="presentation-header__title" data-presentation-title="">{title}</h1>}
  </header>
}
