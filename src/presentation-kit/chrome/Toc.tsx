import type { EraEntry } from '../eras'

interface TocProps {
  entries: readonly EraEntry[]
  activeEra: string
  onGoTo: (index: number) => void
}

export function Toc({ entries, activeEra, onGoTo }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      {entries.map((e) => (
        <button
          key={e.era}
          type="button"
          data-presentation-toc-item=""
          data-presentation-active={e.era === activeEra ? 'true' : undefined}
          aria-current={e.era === activeEra ? 'step' : undefined}
          onClick={() => onGoTo(e.firstIndex)}
        >
          {e.era}
        </button>
      ))}
    </nav>
  )
}
