import { eraStarts } from '../nav'
import type { StepMeta } from '../types'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  go: (i: number) => void
}

export function Toc({ steps, index, go }: TocProps) {
  const eras = eraStarts(steps.map((s) => s.era))
  const activeEra = steps[index].era
  return (
    <nav aria-label="Table of contents" data-presentation-toc="">
      <ol>
        {eras.map(({ era, index: start }) => {
          const active = era === activeEra
          return (
            <li key={`${era}-${start}`}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                data-presentation-toc-entry=""
                data-active={active ? 'true' : 'false'}
                onClick={(e) => {
                  go(start)
                  e.currentTarget.blur()
                }}
              >
                {era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
