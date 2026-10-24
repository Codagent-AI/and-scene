import { STAGE_LAYOUT } from '../constants.ts'
import type { Section } from './sections.ts'

export interface TocProps {
  sections: readonly Section[]
  activeIndex: number
  onJump: (index: number) => void
}

export function Toc({ sections, activeIndex, onJump }: TocProps) {
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{
        position: 'absolute',
        left: STAGE_LAYOUT.browse.side,
        top: STAGE_LAYOUT.browse.top,
        bottom: STAGE_LAYOUT.browse.bottom,
        width: STAGE_LAYOUT.browse.tocWidth - STAGE_LAYOUT.browse.side,
        overflow: 'auto',
      }}
    >
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {sections.map((s) => {
          const active = activeIndex >= s.first && activeIndex <= s.last
          return (
            <li key={`${s.era}:${s.first}`}>
              <button
                type="button"
                data-presentation-toc-item=""
                data-active={active ? 'true' : 'false'}
                aria-current={active ? 'step' : undefined}
                onClick={(e) => {
                  onJump(s.first)
                  if (e.detail > 0) e.currentTarget.blur()
                }}
              >
                {s.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
