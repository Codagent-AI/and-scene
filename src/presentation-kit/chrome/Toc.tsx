import { groupEras } from '../eras.ts'
import type { StepMeta } from '../types.ts'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

/** One entry per consecutive era; activating it jumps to that era's first step. */
export function Toc({ steps, index, onJump }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents" style={{ position: 'fixed', left: 0, top: 64, bottom: 0 }}>
      {groupEras(steps).map((g) => {
        const active = g.indices.includes(index)
        return (
          <button
            key={g.firstIndex}
            type="button"
            data-presentation-toc-entry=""
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'step' : undefined}
            onClick={() => onJump(g.firstIndex)}
          >
            {g.era}
          </button>
        )
      })}
    </nav>
  )
}
