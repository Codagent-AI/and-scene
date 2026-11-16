import type { ReactNode } from 'react'
import type { Mode } from '../types'
export function Header({ title, mode, brand, toggle }: { title: string; mode: Mode; brand?: ReactNode; toggle: () => void }) {
  return <header data-presentation-header=""><div data-presentation-brand="">{brand}</div>
    {mode === 'browse' && <span data-presentation-name="">{title}</span>}
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
