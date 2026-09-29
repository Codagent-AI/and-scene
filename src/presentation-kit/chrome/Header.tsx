import type { ReactNode } from 'react'
import type { PresentationMode, StepMeta } from '../types.ts'
interface HeaderProps { title: string; step: StepMeta; index: number; mode: PresentationMode; brand?: ReactNode; onToggle: () => void }
export function Header({ title, step, index, mode, brand, onToggle }: HeaderProps) {
  return <header className="presentation-header" data-presentation-header="" style={{ position: 'absolute', zIndex: 1, inset: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div className="presentation-header-brand" data-presentation-header-brand="">{brand}</div>
    <div className="presentation-header-title">
      <span className="presentation-marker" data-presentation-marker="">{step.era} · {String(index + 1).padStart(2, '0')}</span>
      {mode === 'browse' ? <><strong>{title}</strong><span>{step.title}</span></> : <strong>{step.title}</strong>}
    </div>
    <button type="button" className="presentation-mode-toggle" data-presentation-mode-toggle="" onClick={onToggle} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
  </header>
}
