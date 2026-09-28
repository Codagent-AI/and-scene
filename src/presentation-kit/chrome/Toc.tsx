import { useMemo } from 'react'
import type { AnyStep } from '../types'

export interface TocProps {
  steps: AnyStep[]
  activeIndex: number
  onGoTo: (index: number) => void
}

interface EraEntry {
  era: string
  firstIndex: number
}

/** Table of contents grouped by each step's era; jumps land on the era's first step. */
export function Toc({ steps, activeIndex, onGoTo }: TocProps) {
  const eras = useMemo<EraEntry[]>(() => {
    const seen = new Set<string>()
    const entries: EraEntry[] = []
    steps.forEach((step, index) => {
      if (seen.has(step.era)) return
      seen.add(step.era)
      entries.push({ era: step.era, firstIndex: index })
    })
    return entries
  }, [steps])

  const activeEra = steps[activeIndex]?.era

  return (
    <nav data-presentation-toc="true" aria-label="Table of contents">
      <ol>
        {eras.map((entry) => {
          const active = entry.era === activeEra
          return (
            <li key={entry.era}>
              <button
                type="button"
                data-presentation-toc-item="true"
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'true' : undefined}
                onClick={() => onGoTo(entry.firstIndex)}
              >
                {entry.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
