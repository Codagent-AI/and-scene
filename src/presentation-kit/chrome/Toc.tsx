import { eraEntries } from '../validate'
import type { StepMeta } from '../types'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  top: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, top, onJump }: TocProps) {
  const activeEra = steps[index]?.era
  return (
    <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 0, top }}>
      <ol>
        {eraEntries(steps).map(({ era, firstIndex }) => {
          const active = era === activeEra
          return (
            <li key={era}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onJump(firstIndex)}
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
