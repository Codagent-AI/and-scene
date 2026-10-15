import type { ReactNode } from 'react'
import type { Mode } from '../constants'
import { formatStepNumber } from '../navLogic'

interface HeaderProps {
  title: string
  mode: Mode
  index: number
  count: number
  stepTitle: string
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: ReactNode
  onToggleMode: () => void
}

export function Header({ title, mode, index, count, stepTitle, brand, onToggleMode }: HeaderProps) {
  return (
    <header data-presentation-header="">
      <div data-presentation-brand="">{brand}</div>
      <div data-presentation-marker="">
        <span data-presentation-marker-number="">{formatStepNumber(index)}</span>
        <span data-presentation-marker-total="">/{formatStepNumber(count - 1)}</span>
      </div>
      {mode === 'present' ? (
        <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {stepTitle}
        </h1>
      ) : (
        <h1 data-presentation-title="">{title}</h1>
      )}
      <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
        {mode === 'present' ? 'Browse' : 'Present'}
      </button>
    </header>
  )
}
