import type { ReactNode } from 'react'
export function Header({ title, brand }: { title: string; brand?: ReactNode }) {
  return <header data-presentation-header="" style={{ position: 'absolute', top: 24, left: 32, right: 32 }}>
    {brand && <div data-presentation-brand="">{brand}</div>}
    <div data-presentation-name="">{title}</div>
  </header>
}
