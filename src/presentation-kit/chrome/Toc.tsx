import type { TocEntry } from './tocEntries'

export interface TocProps {
  entries: TocEntry[]
  activeIndex: number
  onJump: (index: number) => void
}

export function Toc({ entries, activeIndex, onJump }: TocProps) {
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: 0, top: 56, bottom: 220, width: 240, boxSizing: 'border-box', overflow: 'auto', padding: '0 16px' }}
    >
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {entries.map((entry, i) => {
          const end = entries[i + 1]?.firstIndex ?? Infinity
          const active = activeIndex >= entry.firstIndex && activeIndex < end
          return (
            <li key={entry.firstIndex}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
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
