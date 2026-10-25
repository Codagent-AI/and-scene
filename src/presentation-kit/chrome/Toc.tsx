import type { Era } from '../types.ts'
import { activate } from './activate.ts'

interface TocProps {
  eras: Era[]
  activeEra: number
  onGoto: (index: number) => void
}

/** Table of contents: one entry per era, jumping to that era's first step. */
export function Toc({ eras, activeEra, onGoto }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents" style={{ flex: '0 0 auto' }}>
      <ol>
        {eras.map((era, i) => {
          const isActive = i === activeEra
          return (
            <li key={era.label}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-index={era.firstIndex}
                data-active={isActive ? 'true' : undefined}
                aria-current={isActive ? 'step' : undefined}
                onClick={activate(() => onGoto(era.firstIndex))}
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
