import { TOC_WIDTH } from '../constants'
import type { StepMeta } from '../types'
import { eraEntries } from './eras'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  const activeEra = steps[index]?.era
  return (
    <nav
      data-presentation-toc=""
      data-presentation-chrome=""
      aria-label="Table of contents"
      style={{ width: TOC_WIDTH, flex: 'none', overflow: 'hidden' }}
    >
      {eraEntries(steps).map(({ era, first }) => {
        const active = era === activeEra
        return (
          <button
            key={`${era}:${first}`}
            type="button"
            data-presentation-toc-item=""
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'step' : undefined}
            onClick={() => onGoTo(first)}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
