import { eraSections } from '../model'
import type { StepMeta } from '../types'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  width: number
  top: number
  bottom: number
  onGo: (index: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ steps, index, width, top, bottom, onGo }: TocProps) {
  const activeEra = steps[index].era
  return (
    <nav
      data-presentation-toc=""
      aria-label="Contents"
      style={{ position: 'absolute', left: 0, top, bottom, width }}
    >
      <ol>
        {eraSections(steps).map((section) => {
          const active = section.era === activeEra
          return (
            <li key={section.first}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-presentation-active={active ? '' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGo(section.first)}
              >
                {section.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
