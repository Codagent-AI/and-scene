import { groupEras } from '../navigation'
import type { StepMeta } from '../types'
import { activate } from './activate'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (i: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  return (
    <nav data-presentation-toc aria-label="Contents" style={{ flex: 'none' }}>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {groupEras(steps).map((g) => {
          const active = index >= g.start && index <= g.end
          return (
            <li key={g.era}>
              <button
                type="button"
                data-presentation-toc-entry={g.era}
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={activate(() => onGoTo(g.start))}
              >
                {g.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
