import type { CSSProperties, ReactNode } from 'react'
import { STAGE_LAYOUT } from '../constants'
import type { PresentationMode } from '../types'

export interface HeaderProps {
  mode: PresentationMode
  /** Presentation title, shown in browse mode. */
  title: string
  index: number
  count: number
  /** Host-provided branding for the top-left slot; the kit supplies none. */
  brand?: ReactNode
  onToggleMode: () => void
  className?: string
  style?: CSSProperties
}

export function Header({ mode, title, index, count, brand, onToggleMode, className, style, ...rest }: HeaderProps) {
  return (
    <header
      {...rest}
      data-presentation-header=""
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: STAGE_LAYOUT[mode].header,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      <div data-presentation-brand-slot="">{brand}</div>
      {mode === 'browse' ? <h1 data-presentation-title="">{title}</h1> : null}
      <div data-presentation-header-end="">
        <span data-presentation-marker="">
          {index + 1} / {count}
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
