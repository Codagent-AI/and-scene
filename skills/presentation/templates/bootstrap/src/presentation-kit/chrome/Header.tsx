import type { ReactNode } from 'react'
export function Header({ title, mode, brand }: { title: string; mode: 'browse' | 'present'; brand?: ReactNode }) {
  return <header className="presentation-header" data-presentation-header="" data-mode={mode} style={{ position: 'absolute', inset: '0 0 auto', display: 'flex', justifyContent: 'space-between' }}>
    <div data-presentation-brand="">{brand}</div>
    {mode === 'browse' && <h1 data-presentation-title="">{title}</h1>}
  </header>
}
