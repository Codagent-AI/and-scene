import type { Era } from '../types'

export interface TocProps {
  eras: readonly Era[]
  activeEra: string
  onJump: (index: number) => void
}

/** Era-based table of contents; each entry jumps to the first step of its era. */
export function Toc({ eras, activeEra, onJump }: TocProps) {
  return (
    <nav data-presentation-chrome="toc" aria-label="Table of contents">
      <ol style={{ display: 'flex', listStyle: 'none' }}>
        {eras.map((era) => {
          const active = era.label === activeEra
          return (
            <li key={era.label}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
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
