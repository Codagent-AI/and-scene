import type { ReactNode } from 'react'
import type { PresentationMode, Step } from '../types'

export function Header<T>({ title, step, index, mode, brand, onToggleMode }: { title: string; step: Step<T>; index: number; mode: PresentationMode; brand?: ReactNode; onToggleMode: () => void }) {
  return <header data-presentation-header="" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>{brand}</div>
    <div data-presentation-title="">
      {mode === 'present' ? <><span data-presentation-marker="">{String(index + 1).padStart(2, '0')}</span> {step.title}</> : <><span>{title}</span><h1>{step.title}</h1></>}
    </div>
    <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
