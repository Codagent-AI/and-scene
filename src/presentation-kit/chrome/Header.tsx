import type { ReactNode } from 'react'
import { hookAttrs, HOOK } from '../hooks'
import type { PresentationMode } from '../types'

export interface HeaderProps {
  height: number
  brand?: ReactNode
  marker: string
  title?: string
  mode: PresentationMode
  onToggleMode: () => void
}

/** Top chrome: optional host brand, step marker, browse title, and mode toggle. */
export function Header({ height, brand, marker, title, mode, onToggleMode }: HeaderProps) {
  const next = mode === 'browse' ? 'present' : 'browse'
  return (
    <header
      {...hookAttrs(HOOK.header)}
      style={{ position: 'absolute', left: 0, top: 0, right: 0, height, display: 'flex', alignItems: 'center' }}
    >
      {brand ? <div {...hookAttrs(HOOK.brand)}>{brand}</div> : null}
      <span {...hookAttrs(HOOK.marker)}>{marker}</span>
      {mode === 'browse' && title ? <h1 {...hookAttrs(HOOK.title)}>{title}</h1> : null}
      <button
        type="button"
        {...hookAttrs(HOOK.modeToggle)}
        aria-label={`Switch to ${next} mode`}
        onClick={onToggleMode}
        style={{ position: 'absolute', right: 0 }}
      >
        {next === 'present' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
