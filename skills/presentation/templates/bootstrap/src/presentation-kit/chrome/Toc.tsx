import { STAGE_LAYOUT } from '../constants.ts'
import type { Era } from '../steps.ts'

/** Era-based table of contents; an entry jumps to the first step of its era. */
export function Toc({ eras, activeIndex, onJump }: { eras: readonly Era[]; activeIndex: number; onJump: (index: number) => void }) {
  return (
    <nav
      data-presentation-toc=""
      aria-label="Contents"
      style={{
        position: 'absolute',
        left: 0,
        top: STAGE_LAYOUT.browse.top,
        bottom: STAGE_LAYOUT.browse.bottom,
        width: STAGE_LAYOUT.browse.side,
      }}
    >
      <ol>
        {eras.map((era) => {
          const active = era.indices.includes(activeIndex)
          return (
            <li key={era.firstIndex}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'true' : undefined}
                onClick={(e) => {
                  onJump(era.firstIndex)
                  if (e.detail > 0) e.currentTarget.blur()
                }}
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
