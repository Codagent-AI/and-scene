import type { PresentationMode } from '../types'

export function Header({ title, mode }: { title: string; mode: PresentationMode }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-header-brand" data-presentation-brand="" />
    {mode === 'browse' && <h1 className="presentation-header-title">{title}</h1>}
    <div className="presentation-header-mode" data-presentation-mode={mode}>{mode}</div>
  </header>
}
