import { STAGE_LAYOUT } from '../constants'
import { eraSections } from '../steps'
import type { StepMeta } from '../types'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ steps, index, onGoTo }: TocProps) {
  const { top, bottom, toc } = STAGE_LAYOUT.browse
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: 0, top, bottom, width: toc, overflow: 'auto' }}
    >
      <ol style={{ listStyle: 'none' }}>
        {eraSections(steps).map((section) => {
          const isActive = section.indices.includes(index)
          return (
            <li key={`${section.firstIndex}:${section.era}`}>
              <button
                type="button"
                data-presentation-toc-entry=""
                aria-current={isActive ? 'step' : undefined}
                data-presentation-active={isActive ? 'true' : undefined}
                onClick={() => onGoTo(section.firstIndex)}
              >
                {section.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
