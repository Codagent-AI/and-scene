import type { ReactNode } from 'react'
import { stepNumber } from '../steps'
import type { Mode, StepMeta } from '../types'

export interface HeaderProps {
  title: string
  mode: Mode
  step: StepMeta
  index: number
  count: number
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ title, mode, step, index, count, brand, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 24px',
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      {mode === 'browse' && <h1 data-presentation-title="" style={{ margin: 0 }}>{title}</h1>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span data-presentation-marker="" data-presentation-era={step.era}>
          {step.era} · {stepNumber(index)} / {count}
        </span>
        <button
          type="button"
          data-presentation-mode-toggle=""
          aria-pressed={mode === 'present'}
          onClick={onToggleMode}
        >
          {mode === 'present' ? 'Browse' : 'Present'}
        </button>
      </div>
    </header>
  )
}
