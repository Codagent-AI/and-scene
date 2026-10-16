import { buildEras } from '../nav'
import { STAGE_LAYOUT } from '../constants'
import type { AnyStep } from '../types'

export interface TocProps {
  steps: readonly AnyStep[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  const activeEra = steps[index].era
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{
        position: 'absolute',
        left: 0,
        top: STAGE_LAYOUT.browse.top,
        width: STAGE_LAYOUT.browse.toc,
      }}
    >
      {buildEras(steps).map((entry) => {
        const active = entry.era === activeEra
        return (
          <button
            key={`${entry.era}:${entry.firstIndex}`}
            type="button"
            data-presentation-toc-entry={entry.era}
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'step' : undefined}
            onClick={() => onGoTo(entry.firstIndex)}
          >
            {entry.era}
          </button>
        )
      })}
    </nav>
  )
}
