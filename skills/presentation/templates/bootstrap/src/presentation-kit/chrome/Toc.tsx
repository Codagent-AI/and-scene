import { groupByEra } from '../stepNumber'

export interface TocProps {
  steps: readonly { era: string }[]
  index: number
  onJump: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ steps, index, onJump }: TocProps) {
  const groups = groupByEra(steps)
  return (
    <nav data-presentation-toc="" data-presentation-chrome="" aria-label="Table of contents">
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {groups.map((g) => {
          const active = g.indices.includes(index)
          return (
            <li key={`${g.era}:${g.firstIndex}`}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={String(active)}
                aria-current={active ? 'step' : undefined}
                onClick={() => onJump(g.firstIndex)}
              >
                {g.era}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
