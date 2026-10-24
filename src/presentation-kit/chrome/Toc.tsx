import type { Step } from '../types'
import { tocEntries } from './tocEntries'

interface TocProps<T> {
  steps: Step<T>[]
  index: number
  top: number
  bottom: number
  width: number
  onJump: (index: number) => void
}

export function Toc<T>({ steps, index, top, bottom, width, onJump }: TocProps<T>) {
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: 0, top, bottom, width, overflow: 'hidden' }}
    >
      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tocEntries(steps, index).map((e) => (
          <li key={e.era}>
            <button
              type="button"
              data-presentation-toc-item=""
              data-presentation-active={e.active ? 'true' : 'false'}
              aria-current={e.active ? 'step' : undefined}
              onClick={() => onJump(e.firstIndex)}
            >
              {e.era}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
