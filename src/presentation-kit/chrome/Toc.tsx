import type { Section } from '../types.ts'
import { releaseFocusOnPointer } from './focus.ts'

interface TocProps {
  sections: Section[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ sections, index, onGoTo }: TocProps) {
  return (
    <nav
      data-presentation-toc=""
      data-presentation-chrome=""
      aria-label="Table of contents"
      style={{ flex: '0 0 auto' }}
    >
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {sections.map((section) => {
          const active = index >= section.firstIndex && index <= section.lastIndex
          return (
            <li key={section.firstIndex}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'true' : undefined}
                onClick={(event) => {
                  onGoTo(section.firstIndex)
                  releaseFocusOnPointer(event)
                }}
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
