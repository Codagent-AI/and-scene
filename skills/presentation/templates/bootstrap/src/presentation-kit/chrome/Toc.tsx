export interface TocEra {
  era: string
  firstIndex: number
}

export interface TocProps {
  eras: TocEra[]
  activeEra: string
  onSelect: (index: number) => void
}

/** Era-based table of contents; jumping selects that era's first step. */
export function Toc({ eras, activeEra, onSelect }: TocProps) {
  return (
    <nav aria-label="Table of contents" data-presentation-toc="">
      <ul>
        {eras.map((entry) => {
          const active = entry.era === activeEra
          return (
            <li key={entry.era}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-presentation-active={active ? 'true' : 'false'}
                aria-current={active ? 'true' : undefined}
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
