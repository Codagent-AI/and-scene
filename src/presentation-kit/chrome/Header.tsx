import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

interface HeaderProps { title: string; mode: PresentationMode; onToggleMode: () => void; brand?: ReactNode }
export function Header({ title, mode, onToggleMode, brand }: HeaderProps) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-header__brand" data-presentation-brand="">{brand}</div>
    {mode === 'browse' && <h1 className="presentation-header__title" data-presentation-title="">{title}</h1>}
    <button type="button" className="presentation-mode-toggle" data-presentation-mode-toggle="" aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`} onClick={onToggleMode}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
