import { useMemo } from 'react'
import { groupEras } from './groupEras.ts'

interface TocProps {
  eras: readonly string[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ eras, index, onGoTo }: TocProps) {
  const entries = useMemo(() => groupEras(eras), [eras])
  return (
    <nav aria-label="Contents" data-presentation-toc="">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {entries.map((entry) => {
          const active = index >= entry.first && index <= entry.last
          return (
            <li key={entry.first}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(entry.first)}
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
