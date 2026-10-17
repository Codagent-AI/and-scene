import { TOC_WIDTH } from '../constants.ts'
import { sectionIndexOf, sectionsOf } from '../steps.ts'
import type { AnyStep } from '../types.ts'

interface TocProps {
  steps: readonly AnyStep[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  const current = sectionIndexOf(steps, index)
  return (
    <nav
      data-presentation-toc
      aria-label="Table of contents"
      style={{ position: 'absolute', top: 64, bottom: 200, left: 0, width: TOC_WIDTH, overflow: 'auto' }}
    >
      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {sectionsOf(steps).map((section, i) => {
          const active = i === current
          return (
            <li key={section.era}>
              <button
                type="button"
                data-presentation-toc-item
                data-presentation-chrome
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'true' : undefined}
                onClick={() => onGoTo(section.firstIndex)}
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
