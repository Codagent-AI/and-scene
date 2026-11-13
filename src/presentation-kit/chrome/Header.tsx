import type { ReactNode } from 'react'
import type { Mode } from '../types'
export function Header({ title, marker, mode, brand, toggleMode }: { title: string; marker: string; mode: Mode; brand?: ReactNode; toggleMode: () => void }) {
  return <header data-presentation-header="">
    <div data-presentation-brand="">{brand}</div>
    <span data-presentation-marker="" data-testid="step-marker">{marker}</span>
    {mode === 'browse' && <span data-presentation-name="">{title}</span>}
    <button data-presentation-mode-toggle="" onClick={toggleMode} aria-label="Toggle presentation mode">{mode === 'browse' ? 'Present ↗' : 'Browse ↙'}</button>
  </header>
}
