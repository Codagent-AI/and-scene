import { STAGE_LAYOUT } from '../constants.ts'
import type { StepMeta } from '../types.ts'
import { jump } from './jump.ts'
import { tocEntries } from './tocEntries.ts'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, onJump }: TocProps) {
  const activeEra = steps[index].era
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: 0, top: STAGE_LAYOUT.browse.top, bottom: STAGE_LAYOUT.browse.bottom, width: STAGE_LAYOUT.browse.toc }}
    >
      <ol>
        {tocEntries(steps).map((entry) => {
          const active = entry.era === activeEra
          return (
            <li key={entry.era}>
              <button
                type="button"
                data-presentation-toc-entry=""
                aria-current={active ? 'step' : undefined}
                data-presentation-active={active ? 'true' : undefined}
                onClick={jump(onJump, entry.first)}
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
