import { eraStarts } from '../geometry.ts'
import type { StepMeta } from '../types.ts'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ steps, index, onJump }: TocProps) {
  const activeEra = steps[index]?.era
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      {eraStarts(steps).map(({ era, firstIndex }) => {
        const active = era === activeEra
        return (
          <button
            key={era}
            type="button"
            data-presentation-toc-item=""
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'true' : undefined}
            onClick={() => onJump(firstIndex)}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
