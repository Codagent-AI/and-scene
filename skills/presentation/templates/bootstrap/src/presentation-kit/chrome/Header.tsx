import type { ReactNode } from 'react'
export function Header({ title, brand, mode, toggle }: { title: string; brand?: ReactNode; mode: string; toggle: () => void }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
    <div data-presentation-brand="">{brand}</div>
    {mode === 'browse' && <div data-presentation-name="">{title}</div>}
    <button data-presentation-mode-toggle="" onClick={toggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present ↗' : 'Browse ↙'}</button>
  </header>
}
