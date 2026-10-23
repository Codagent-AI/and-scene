import type { HTMLAttributes } from 'react'
import type { Step } from '../types'
import { tocEntries } from './tocEntries'

export interface TocProps<TPayload> extends HTMLAttributes<HTMLElement> {
  steps: readonly Step<TPayload>[]
  activeIndex: number
  onJump: (index: number) => void
}

/** Era table of contents. Entries jump to the first step of their era. */
export function Toc<TPayload>({ steps, activeIndex, onJump, style, ...rest }: TocProps<TPayload>) {
  const activeEra = steps[activeIndex]?.era
  return (
    <nav
      aria-label="Table of contents"
      data-presentation-toc=""
      {...rest}
      style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto', ...style }}
    >
      {tocEntries(steps).map((entry) => {
        const active = entry.era === activeEra
        return (
          <button
            key={entry.era}
            type="button"
            data-presentation-toc-entry=""
            data-era={entry.era}
            {...(active ? { 'aria-current': 'step' as const, 'data-presentation-active': 'true' } : {})}
            onClick={() => onJump(entry.firstIndex)}
          >
            {entry.era}
          </button>
        )
      })}
    </nav>
  )
}
