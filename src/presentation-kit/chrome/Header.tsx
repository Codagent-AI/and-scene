import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'
export function Header({ title, stepTitle, mode, index, total, brand }: { title: string; stepTitle?: string; mode: PresentationMode; index: number; total: number; brand?: ReactNode }) {
  return <header data-presentation-header style={{ position: 'absolute', inset: '0 0 auto', display: 'flex', justifyContent: 'space-between' }}><div>{brand}</div><div data-presentation-title>{mode === 'present' ? `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')} · ${stepTitle ?? title}` : title}</div></header>
}
