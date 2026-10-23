import { STAGE_LAYOUT, TOC_WIDTH } from '../constants'
import { groupEras } from '../eras'
import type { StepMeta } from '../types'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ steps, index, onGoTo }: TocProps) {
  const { top, bottom, side } = STAGE_LAYOUT.browse
  return (
    <nav
      data-presentation-toc=""
      aria-label="Contents"
      style={{ position: 'absolute', left: side, top, bottom, width: TOC_WIDTH, overflow: 'auto', boxSizing: 'border-box' }}
    >
      {groupEras(steps).map((era) => {
        const active = era.indices.includes(index)
        return (
          <button
            key={era.firstIndex}
            type="button"
            data-presentation-toc-entry=""
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'step' : undefined}
            onClick={() => onGoTo(era.firstIndex)}
            style={{ display: 'block' }}
          >
            {era.era}
          </button>
        )
      })}
    </nav>
  )
}
