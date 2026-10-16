import type { StepMeta } from '../types'
import { buildToc } from './buildToc'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  const entries = buildToc(steps)
  const activeEra = steps[index]?.era
  return (
    <nav data-presentation-toc aria-label="Table of contents">
      <ol>
        {entries.map((e) => {
          const active = e.era === activeEra
          return (
            <li key={`${e.firstIndex}:${e.era}`}>
              <button
                type="button"
                data-presentation-toc-item
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(e.firstIndex)}
              >
                {e.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
