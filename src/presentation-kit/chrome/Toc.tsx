import { activeEraIndex, eraSections } from '../model.ts'
import type { StepMeta } from '../types.ts'
import type { SlotProps } from './slots.ts'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
  slot?: SlotProps
}

/** Era-based table of contents; entries jump to the first step of their era. */
export function Toc({ steps, index, onJump, slot }: TocProps) {
  const eras = eraSections(steps)
  const active = activeEraIndex(eras, index)
  return (
    <nav aria-label="Table of contents" {...slot} data-presentation-toc="">
      <ol style={{ listStyle: 'none' }}>
        {eras.map((era, i) => {
          const isActive = i === active
          return (
            <li key={`${era.label}:${era.firstIndex}`}>
              <button
                type="button"
                onClick={() => onJump(era.firstIndex)}
                aria-current={isActive ? 'true' : undefined}
                data-presentation-toc-item=""
                data-presentation-active={isActive ? '' : undefined}
              >
                {era.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
