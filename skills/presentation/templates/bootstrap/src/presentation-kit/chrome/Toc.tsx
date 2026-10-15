import type { Era } from '../navLogic'

interface TocProps {
  eras: readonly Era[]
  activeEra: string
  onJump: (index: number) => void
}

/** Era-based table of contents; entries jump to the first step of their era. */
export function Toc({ eras, activeEra, onJump }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {eras.map((era) => {
          const active = era.label === activeEra
          return (
            <li key={era.label}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'location' : undefined}
                onClick={() => onJump(era.firstIndex)}
              >
                {era.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
