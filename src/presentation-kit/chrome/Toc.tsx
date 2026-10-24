import { STAGE_LAYOUT } from '../constants'
import type { Section } from '../steps'

export interface TocProps {
  sections: Section[]
  /** Index of the section containing the active step. */
  active: number
  onJump: (stepIndex: number) => void
}

/** Era-based table of contents; an entry jumps to the first step of its section. */
export function Toc({ sections, active, onJump }: TocProps) {
  return (
    <nav
      data-presentation-chrome="toc"
      aria-label="Sections"
      style={{ position: 'absolute', left: 0, top: STAGE_LAYOUT.browse.top, width: STAGE_LAYOUT.browse.tocWidth }}
    >
      <div data-presentation-toc-list="">
        {sections.map((section, i) => {
          const isActive = i === active
          return (
            <button
              key={`${section.era}:${section.first}`}
              type="button"
              data-presentation-toc-item=""
              data-presentation-active={isActive ? 'true' : undefined}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => onJump(section.first)}
            >
              {section.era}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
