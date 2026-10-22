import { STAGE_LAYOUT } from '../constants.ts'
import { buildToc } from '../steps.ts'
import type { StepMeta } from '../types.ts'
import { press } from './press.ts'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ steps, index, onJump }: TocProps) {
  const g = STAGE_LAYOUT.browse
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: g.side, top: g.top, bottom: g.bottom, width: g.tocWidth }}
    >
      <ol>
        {buildToc(steps).map((entry) => {
          const active = entry.indices.includes(index)
          return (
            <li key={entry.firstIndex}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'true' : undefined}
                onClick={press(() => onJump(entry.firstIndex))}
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
