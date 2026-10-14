import { STAGE_LAYOUT } from '../constants'
import type { StepMeta } from '../types'
import { eraEntries } from '../usePresentationNav'

interface TocProps {
  steps: readonly StepMeta[]
  activeIndex: number
  onJump: (index: number) => void
}

export function Toc({ steps, activeIndex, onJump }: TocProps) {
  const activeEra = steps[activeIndex]?.era
  return (
    <nav
      data-presentation-toc=""
      aria-label="Table of contents"
      style={{
        position: 'absolute',
        left: 0,
        top: STAGE_LAYOUT.browse.top,
        width: STAGE_LAYOUT.browse.tocWidth,
      }}
    >
      {eraEntries(steps).map(({ era, firstIndex }) => {
        const active = era === activeEra
        return (
          <button
            key={era}
            type="button"
            data-presentation-toc-item=""
            data-presentation-era={era}
            aria-current={active ? 'true' : undefined}
            data-presentation-active={active ? 'true' : undefined}
            onClick={() => onJump(firstIndex)}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
