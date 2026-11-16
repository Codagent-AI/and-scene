import type { ReactNode } from 'react'
import type { Mode } from '../types'
export function Header({ title, marker, mode, toggle, brand }: { title: string; marker: string; mode: Mode; toggle: () => void; brand?: ReactNode }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div data-presentation-brand="">{brand}</div>
    <div data-presentation-marker="">{marker}{mode === 'browse' && <span data-presentation-name=""> / {title}</span>}</div>
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present ↗' : 'Browse ↙'}</button>
  </header>
}
