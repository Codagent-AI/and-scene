import type { ReactNode } from 'react'
export function Header({ title, mode, index, branding }: { title: string; mode: 'browse' | 'present'; index: number; branding?: ReactNode }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-header__brand">{branding}</div>
    <div className="presentation-header__marker" data-presentation-marker="">{String(index + 1).padStart(2, '0')}</div>
    {(mode === 'browse' || title) && <h1 className="presentation-header__title">{title}</h1>}
  </header>
}
