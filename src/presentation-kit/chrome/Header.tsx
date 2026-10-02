import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

export function Header({ title, mode, brand, onToggleMode }: { title: string; mode: PresentationMode; brand?: ReactNode; onToggleMode: () => void }) {
  return <header className="presentation-header" data-presentation-header>
    <div className="presentation-header__brand" data-presentation-brand>{brand}</div>
    {mode === 'browse' && <h1 className="presentation-header__title" data-presentation-title>{title}</h1>}
    <div className="presentation-header__actions">
      <button type="button" className="presentation-mode-toggle" data-presentation-mode-toggle onClick={onToggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
    </div>
  </header>
}
