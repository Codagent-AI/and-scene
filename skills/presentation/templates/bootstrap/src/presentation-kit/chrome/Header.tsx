import type { ReactNode } from 'react'
export function Header({ title, mode, brand }: { title: string; mode: 'browse' | 'present'; brand?: ReactNode }) {
  return <header data-presentation-header data-mode={mode} style={{ position: 'absolute', zIndex: 2, inset: '24px 32px auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{brand ? <div data-presentation-brand>{brand}</div> : null}{mode === 'browse' ? <h1 data-presentation-title>{title}</h1> : <span data-presentation-marker aria-hidden="true" />}</header>
}
