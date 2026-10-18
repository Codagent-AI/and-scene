import { eraGroups } from '../steps'
import type { StepMeta } from '../types'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

/** Era-based table of contents; each entry jumps to the first step of its era. */
export function Toc({ steps, index, onJump }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol>
        {eraGroups(steps).map((group) => {
          const active = index >= group.firstIndex && index <= group.lastIndex
          return (
            <li key={group.firstIndex}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? '' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onJump(group.firstIndex)}
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
