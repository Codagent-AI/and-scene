import type { ReactNode } from 'react'
import { STAGE_LAYOUT, type Mode } from '../constants'
import type { StepMeta } from '../types'

interface HeaderProps {
  mode: Mode
  step: StepMeta
  index: number
  count: number
  brand?: ReactNode
}

const pad = (n: number) => String(n).padStart(2, '0')

export function Header({ mode, step, index, count, brand }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      data-presentation-chrome=""
      style={{ height: STAGE_LAYOUT[mode].top, flex: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, flex: 'none' }}>
        <div data-presentation-brand-slot="">{brand}</div>
        <span data-presentation-marker="">
          {pad(index + 1)} / {pad(count)} · {step.era}
        </span>
      </div>
      {mode === 'browse' && (
        <h1 data-presentation-title="" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {step.title}
        </h1>
      )}
    </header>
  )
}
