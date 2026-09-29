import type { ReactNode } from 'react'
export function Header({ title, mode, brand }: { title: string; mode: 'browse' | 'present'; brand?: ReactNode }) {
  return <header className="presentation-header" data-presentation-header="">
    <div className="presentation-brand" data-presentation-brand="">{brand}</div>
    {mode === 'browse' && <div className="presentation-header-title" data-presentation-title="">{title}</div>}
  </header>
}
