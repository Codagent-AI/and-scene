import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'
export function Header({ step, index, mode, brand, toggleMode }: { step: StepMeta; index: number; mode: Mode; brand?: ReactNode; toggleMode: () => void }) {
  return <header data-presentation-header=""><div data-presentation-brand="">{brand}</div><div data-presentation-marker="">{String(index + 1).padStart(2, '0')} / <span data-presentation-era="">{step.era}</span></div><h1 data-presentation-title="">{step.title}</h1><button data-presentation-mode-toggle="" onClick={toggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button></header>
}
