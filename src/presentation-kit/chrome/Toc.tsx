import { eraEntries } from '../eras'
import type { StepMeta } from '../types'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  const current = steps[index]?.era
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2 }}
    >
      <ol>
        {eraEntries(steps).map((era) => {
          const active = era.label === current
          return (
            <li key={era.label}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'true' : undefined}
                onClick={() => onGoTo(era.first)}
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
