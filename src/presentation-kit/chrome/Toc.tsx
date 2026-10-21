import { eraRunIndex, groupEras } from '../eras'
import type { StepMeta } from '../types'

export interface TocProps {
  steps: ReadonlyArray<Pick<StepMeta, 'era'>>
  index: number
  onJump: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era run. */
export function Toc({ steps, index, onJump }: TocProps) {
  const runs = groupEras(steps)
  const active = eraRunIndex(runs, index)
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      {runs.map((run, i) => {
        const isActive = i === active
        return (
          <button
            key={`${run.start}:${run.era}`}
            type="button"
            data-presentation-toc-entry=""
            data-presentation-active={isActive ? 'true' : undefined}
            aria-current={isActive ? 'location' : undefined}
            onClick={() => onJump(run.start)}
          >
            {run.era}
          </button>
        )
      })}
    </nav>
  )
}
