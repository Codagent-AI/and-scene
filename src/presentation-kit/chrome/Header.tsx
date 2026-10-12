import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'
export function Header({ title, mode, stepNumber, brand }: { title: string; mode: PresentationMode; stepNumber: number; brand?: ReactNode }) { return <header data-presentation-header style={{ position: 'absolute', top: 0, left: 0, right: 0, minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{brand ?? null}{mode === 'present' && <span data-presentation-step-marker aria-hidden="true">{stepNumber}</span>}<span data-presentation-title>{title}</span></header> }
