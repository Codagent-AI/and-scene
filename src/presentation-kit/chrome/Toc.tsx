export interface TocEra {
  era: string
  firstIndex: number
}

export interface TocProps {
  eras: TocEra[]
  activeIndex: number
  onSelect: (index: number) => void
}

/** Era-based table of contents. Jumping to an entry lands on that era's first step. */
export function Toc({ eras, activeIndex, onSelect }: TocProps) {
  return (
    <nav
      className="and-scene-toc"
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
    >
      <ul>
        {eras.map((entry, index) => {
          const nextEntry = eras[index + 1]
          const isActive = activeIndex >= entry.firstIndex && (!nextEntry || activeIndex < nextEntry.firstIndex)
          return (
            <li key={entry.era}>
              <button
                type="button"
                className="and-scene-toc-entry"
                data-presentation-toc-entry=""
                data-active={isActive}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelect(entry.firstIndex)}
              >
                {entry.era}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
