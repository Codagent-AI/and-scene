import type { Era } from './eras'

export interface TocProps {
  eras: Era[]
  activeEra: string
  onSelect: (index: number) => void
}

export function Toc({ eras, activeEra, onSelect }: TocProps) {
  return (
    <nav aria-label="Table of contents" data-presentation-toc="">
      <ol>
        {eras.map((entry) => {
          const active = entry.era === activeEra
          return (
            <li key={entry.era}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onSelect(entry.firstIndex)}
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
