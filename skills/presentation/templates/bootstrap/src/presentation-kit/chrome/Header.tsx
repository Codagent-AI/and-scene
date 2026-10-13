import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

export function Header({ title, era, stepNumber, mode, brand }: { title: string; era: string; stepNumber: number; mode: PresentationMode; brand?: ReactNode }) {
  return <header data-presentation-header style={{ position: 'absolute', top: 20, left: 24, right: 24 }}><div>{brand}</div><div><span data-presentation-marker>{String(stepNumber).padStart(2, '0')} · {era}</span>{mode === 'browse' && <h1>{title}</h1>}</div></header>
}
