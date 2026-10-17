import type { Section } from '../types.ts'
import { onPointerAwareClick } from './focus.ts'

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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sections.map((section) => {
          const active = index >= section.firstIndex && index <= section.lastIndex
          return (
            <button
              key={section.firstIndex}
              type="button"
              data-presentation-toc-item=""
              data-presentation-active={active ? 'true' : undefined}
              aria-current={active ? 'true' : undefined}
              onClick={onPointerAwareClick(() => onGoTo(section.firstIndex))}
            >
              {section.era}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
