import type { ReactNode } from 'react'
import { STAGE_LAYOUT, type PresentationMode } from '../constants'
import { formatStepNumber } from '../steps'

export interface HeaderProps {
  mode: PresentationMode
  index: number
  era: string
  title: string
  /** Host-provided branding for the top-left slot; empty by default. */
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ mode, index, era, title, brand, onToggleMode }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: STAGE_LAYOUT[mode].top,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      <div data-presentation-marker="" style={{ display: 'flex', alignItems: 'center' }}>
        <span data-presentation-step-number="">{formatStepNumber(index)}</span>
        <span data-presentation-era="">{era}</span>
      </div>
      {mode === 'browse' ? (
        <h1 data-presentation-title="" style={{ flex: 1, minWidth: 0 }}>
          {title}
        </h1>
      ) : (
        <span style={{ flex: 1 }} />
      )}
      <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
