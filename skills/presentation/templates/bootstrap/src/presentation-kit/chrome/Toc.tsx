import { HEADER_HEIGHT, STAGE_LAYOUT, TOC_WIDTH } from '../constants'
import type { StepMeta } from '../types'
import { tocEntries } from './tocEntries'

export interface TocProps {
  steps: readonly StepMeta[]
  activeIndex: number
  onJump: (index: number) => void
}

export function Toc({ steps, activeIndex, onJump }: TocProps) {
  const entries = tocEntries(steps)
  // Entries are runs of consecutive steps, so exactly one entry is current even when era labels repeat.
  const activeEntry = entries.findLastIndex((entry) => entry.firstIndex <= activeIndex)
  return (
    <nav
      data-presentation-toc
      aria-label="Table of contents"
      style={{
        position: 'absolute',
        top: HEADER_HEIGHT,
        bottom: STAGE_LAYOUT.browse.bottom,
        left: 0,
        width: TOC_WIDTH,
        overflow: 'auto',
      }}
    >
      <ol>
        {entries.map((entry, entryIndex) => {
          const active = entryIndex === activeEntry
          return (
            <li key={entry.firstIndex}>
              <button
                type="button"
                data-presentation-toc-entry
                data-presentation-active={active ? '' : undefined}
                aria-current={active ? 'true' : undefined}
                onClick={() => onJump(entry.firstIndex)}
              >
                {entry.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
