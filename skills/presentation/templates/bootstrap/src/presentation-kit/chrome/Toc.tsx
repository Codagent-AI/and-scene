import { STAGE_LAYOUT } from '../constants.ts'
import { firstIndexOfEra } from '../nav.ts'
import type { StepMeta } from '../types.ts'
import { activeProps } from './activeProps.ts'
import { tocEras } from './tocEras.ts'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  const eraOf = steps.map((s) => s.era)
  const g = STAGE_LAYOUT.browse
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: 0, top: g.top, bottom: g.bottom, width: g.side }}
    >
      <ol>
        {tocEras(steps).map((era) => {
          const first = firstIndexOfEra(eraOf, era)
          return (
            <li key={era}>
              <button
                type="button"
                data-presentation-toc-item=""
                onClick={() => onGoTo(first)}
                {...activeProps(era === steps[index].era, 'true')}
              >
                {era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
