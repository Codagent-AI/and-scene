import type { StepMeta } from '../types'
import { buildToc } from './helpers'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, onJump }: TocProps) {
  const entries = buildToc(steps)
  const activeEntry = entries.filter((e) => e.firstIndex <= index).pop()
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol>
        {entries.map((entry) => {
          const isActive = entry === activeEntry
          return (
            <li key={entry.firstIndex}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-presentation-active={isActive ? 'true' : undefined}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onJump(entry.firstIndex)}
              >
                {entry.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
