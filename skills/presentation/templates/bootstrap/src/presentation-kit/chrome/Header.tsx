import type { PresentationMode } from '../types'
export function Header({ title, index, mode, onToggleMode }: { title: string; index: number; mode: PresentationMode; onToggleMode: () => void }) {
  return <header className="presentation-header" data-presentation-header style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 52 }}>
    <span className="presentation-header__marker" data-presentation-marker>{String(index + 1).padStart(2, '0')}</span>
    {mode === 'browse' && <h1 className="presentation-header__title" data-presentation-title>{title}</h1>}
    <button type="button" className="presentation-mode-toggle" data-presentation-mode-toggle aria-label={mode === 'browse' ? 'Switch to present mode' : 'Switch to browse mode'} onClick={onToggleMode}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
