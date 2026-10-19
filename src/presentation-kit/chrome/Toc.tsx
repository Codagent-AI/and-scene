import { eraEntries } from '../eras'
import type { StepMeta } from '../types'

export interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, onJump }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol>
        {eraEntries(steps, index).map((e) => (
          <li key={e.first}>
            <button
              type="button"
              data-presentation-toc-item=""
              data-presentation-toc-index={e.first}
              data-presentation-active={e.active ? 'true' : undefined}
              aria-current={e.active ? 'location' : undefined}
              onClick={(ev) => {
                onJump(e.first)
                if (ev.detail > 0) ev.currentTarget.blur()
              }}
            >
              {e.era}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
