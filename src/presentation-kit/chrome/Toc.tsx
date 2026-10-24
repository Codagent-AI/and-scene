import { STAGE_LAYOUT } from '../constants'
import type { StepMeta } from '../types'
import { activeProps } from './activeProps'
import { getEras } from './eras'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, onJump }: TocProps) {
  const activeEra = steps[index]?.era
  return (
    <nav
      aria-label="Sections"
      data-presentation-toc=""
      data-presentation-chrome="toc"
      style={{
        position: 'absolute',
        top: STAGE_LAYOUT.browse.insetTop / 2,
        left: 0,
        right: 0,
        height: STAGE_LAYOUT.browse.insetTop / 2,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {getEras(steps).map((era) => (
        <button
          key={era.label}
          type="button"
          data-presentation-toc-entry={era.label}
          onClick={() => onJump(era.firstIndex)}
          {...activeProps(era.label === activeEra)}
        >
          {era.label}
        </button>
      ))}
    </nav>
  )
}
