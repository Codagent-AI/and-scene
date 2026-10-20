import type { StepMeta } from '../types.ts'
import { buildToc } from './buildToc.ts'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, onJump }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol style={{ display: 'flex' }}>
        {buildToc(steps, index).map((entry) => (
          <li key={entry.era}>
            <button
              type="button"
              data-presentation-toc-entry=""
              data-presentation-active={entry.active ? 'true' : 'false'}
              aria-current={entry.active ? 'true' : undefined}
              onClick={() => onJump(entry.start)}
            >
              {entry.era}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
