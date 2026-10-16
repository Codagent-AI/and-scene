import { activeEraIndex, type EraEntry } from '../steps'

export interface TocProps {
  entries: readonly EraEntry[]
  index: number
  onJump: (stepIndex: number) => void
}

export function Toc({ entries, index, onJump }: TocProps) {
  const active = activeEraIndex(entries, index)
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol style={{ display: 'flex', gap: 8, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
        {entries.map((e, i) => (
          <li key={`${e.era}-${e.start}`}>
            <button
              type="button"
              data-presentation-toc-entry=""
              data-presentation-active={i === active}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => onJump(e.start)}
            >
              {e.era}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
