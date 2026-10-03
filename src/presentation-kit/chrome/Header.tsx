import type { ReactNode } from 'react'
import type { PresentationMode, Step } from '../types'
export function Header<T>({ title, step, index, mode, brand }: { title: string; step: Step<T>; index: number; mode: PresentationMode; brand?: ReactNode }) { return <header className="presentation-header" data-presentation-header>{brand && <div className="presentation-brand">{brand}</div>}<div className="presentation-marker" data-presentation-marker>{step.era} · {String(index + 1).padStart(2, '0')}</div>{mode === 'browse' && <h1 className="presentation-title">{title}</h1>}</header> }
