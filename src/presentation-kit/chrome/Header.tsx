import type { HTMLAttributes, ReactNode } from 'react'
export function Header({ title, marker, brand, ...props }: HTMLAttributes<HTMLElement> & { title: string; marker: string; brand?: ReactNode }) {
  return <header data-presentation-header="" {...props}>{brand}<span data-presentation-marker="">{marker}</span><h1 data-presentation-title="" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1></header>
}
