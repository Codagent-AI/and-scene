import type { ReactNode } from 'react'
export function Header({ brand, title, marker }: { brand?: ReactNode; title: string; marker: string }) {
 return <header data-presentation-header>{brand}<span data-presentation-marker>{marker}</span><span data-presentation-title>{title}</span></header>
}
