import { groupByEra } from '../steps.ts'
import type { StepMeta } from '../types.ts'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ steps, index, onGoTo }: TocProps) {
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ flex: '0 0 auto', overflowY: 'auto' }}
    >
      <ol>
        {groupByEra(steps).map((group) => {
          const active = group.indices.includes(index)
          return (
            <li key={group.first}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : 'false'}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(group.first)}
              >
                {group.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
