import type { Section } from '../navigation'

export interface TocProps {
  sections: readonly Section[]
  index: number
  onGoTo(index: number): void
}

export function Toc({ sections, index, onGoTo }: TocProps) {
  return (
    <nav aria-label="Sections" data-presentation-toc="">
      <ol>
        {sections.map((section) => {
          const active = index >= section.firstIndex && index <= section.lastIndex
          return (
            <li key={section.firstIndex}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
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
