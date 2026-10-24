import type { HTMLAttributes } from 'react'
import type { EraSection } from '../steps.ts'

export interface TocProps extends HTMLAttributes<HTMLElement> {
  sections: readonly EraSection[]
  activeSection: number
  width: number
  onJump: (index: number) => void
}

/** Era-based table of contents; each entry jumps to its era's first step. */
export function Toc({ sections, activeSection, width, onJump, style, ...rest }: TocProps) {
  return (
    <nav aria-label="Table of contents" data-presentation-toc="" {...rest} style={{ flex: 'none', width, boxSizing: 'border-box', overflow: 'auto', ...style }}>
      <ol>
        {sections.map((section, i) => {
          const active = i === activeSection
          return (
            <li key={`${section.era}:${section.firstIndex}`}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onJump(section.firstIndex)}
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
