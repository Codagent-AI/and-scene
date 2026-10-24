import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

interface HeaderProps {
  height: number
  stepNumber: number
  stepCount: number
  era: string
  mode: PresentationMode
  onToggleMode: () => void
  /** Host-provided brand. The kit renders no brand of its own. */
  brand?: ReactNode
  /** Presentation title, shown in browse mode. */
  title?: string
}

export function Header({
  height,
  stepNumber,
  stepCount,
  era,
  mode,
  onToggleMode,
  brand,
  title,
}: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <div data-presentation-brand-slot="" style={{ display: 'flex', alignItems: 'center' }}>
        {brand}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span data-presentation-marker="">
          {String(stepNumber).padStart(2, '0')} / {String(stepCount).padStart(2, '0')}
        </span>
        {mode === 'browse' ? (
          <>
            <span data-presentation-era="">{era}</span>
            {title ? <span data-presentation-deck-title="">{title}</span> : null}
          </>
        ) : null}
        <button
          type="button"
          data-presentation-mode-toggle=""
          aria-pressed={mode === 'browse'}
          onClick={onToggleMode}
        >
          {mode === 'present' ? 'Browse' : 'Present'}
        </button>
      </div>
    </header>
  )
}
