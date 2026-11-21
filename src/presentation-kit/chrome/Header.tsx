import type { ReactNode } from 'react'

export function Header({ brand, index, count, title }: {
  brand?: ReactNode
  index: number
  count: number
  title: string
}) {
  return (
    <header data-presentation-header="" style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
      {brand && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="">{index + 1} / {count}</span>
      <h1 data-presentation-title="" style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
    </header>
  )
}
