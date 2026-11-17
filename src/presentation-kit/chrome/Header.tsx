import type { ReactNode } from 'react'
import type { Mode } from '../types'
export function Header({ title, mode, brand, index, toggle }: { title: string; mode: Mode; brand?: ReactNode; index: number; toggle: () => void }) {
  return <header data-presentation-header="">
    {brand && <div data-presentation-brand="">{brand}</div>}
    <span data-presentation-marker="">{String(index + 1).padStart(2, '0')}</span>
    {mode === 'browse' && <span data-presentation-name="">{title}</span>}
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
