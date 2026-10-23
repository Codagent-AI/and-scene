import type { ReactNode } from 'react'
import { stepNumber } from '../model'
import type { Mode, StepMeta } from '../types'

interface HeaderProps {
  mode: Mode
  title: string
  step: StepMeta
  index: number
  count: number
  /** Host-provided brand. The kit never renders a default one. */
  brand?: ReactNode
  height: number
}

export function Header({ mode, title, step, index, count, brand, height }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <span data-presentation-marker="">
        <span data-presentation-marker-number="">
          {stepNumber(index)} / {count}
        </span>{' '}
        <span data-presentation-marker-era="">{step.era}</span>
      </span>
      {mode === 'browse' ? (
        <span data-presentation-title="">{title}</span>
      ) : (
        <span aria-hidden="true" />
      )}
    </header>
  )
}
