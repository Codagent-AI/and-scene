import type { ReactNode } from 'react'
import { stepNumber } from '../steps.ts'
import type { Mode } from '../types.ts'

interface HeaderProps {
  mode: Mode
  index: number
  count: number
  title: string
  presentationTitle: string
  /** Host-provided brand; the kit renders no default brand. */
  brand?: ReactNode
}

export function Header({ mode, index, count, title, presentationTitle, brand }: HeaderProps) {
  return (
    <header data-presentation-header="" style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0 1rem' }}>
      {brand !== undefined && brand !== null && <div data-presentation-brand="">{brand}</div>}
      <span data-presentation-marker="">
        {String(stepNumber(index)).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </span>
      {mode === 'browse' ? (
        <h1 data-presentation-title="" data-step-title="">{title}</h1>
      ) : (
        <span data-presentation-name="">{presentationTitle}</span>
      )}
    </header>
  )
}
