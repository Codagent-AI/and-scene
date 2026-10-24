import { buildEras } from '../eras'
import type { StepMeta } from '../types'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, onJump }: TocProps) {
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto' }}
    >
      {buildEras(steps).map((era) => {
        const active = index >= era.firstIndex && index <= era.lastIndex
        return (
          <button
            key={era.firstIndex}
            type="button"
            data-presentation-toc-item=""
            data-presentation-era={era.label}
            data-presentation-active={active}
            aria-current={active ? 'step' : undefined}
            onClick={() => onJump(era.firstIndex)}
          >
            {era.label}
          </button>
        )
      })}
    </nav>
  )
}
