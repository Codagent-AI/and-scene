import { sectionsOf } from '../steps'
import type { StepMeta } from '../types'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  return (
    <nav data-presentation-toc aria-label="Table of contents" style={{ flex: 'none' }}>
      <ol>
        {sectionsOf(steps).map((section) => {
          const active = section.indexes.includes(index)
          return (
            <li key={section.era}>
              <button
                type="button"
                data-presentation-toc-item
                data-presentation-active={active}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(section.first)}
              >
                {section.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
