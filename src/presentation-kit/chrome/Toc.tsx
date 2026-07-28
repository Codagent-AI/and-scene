import type { Step } from '../types'

export interface TocProps<TPayload> {
  steps: Step<TPayload>[]
  activeIndex: number
  onSelectEra: (firstStepIndex: number) => void
}

interface EraEntry {
  era: string
  firstStepIndex: number
}

function groupByEra<TPayload>(steps: Step<TPayload>[]): EraEntry[] {
  const entries: EraEntry[] = []
  steps.forEach((step, index) => {
    if (!entries.some((entry) => entry.era === step.era)) {
      entries.push({ era: step.era, firstStepIndex: index })
    }
  })
  return entries
}

export function Toc<TPayload>({ steps, activeIndex, onSelectEra }: TocProps<TPayload>) {
  const entries = groupByEra(steps)
  const activeEra = steps[activeIndex]?.era

  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ul>
        {entries.map((entry) => {
          const active = entry.era === activeEra
          return (
            <li key={entry.era}>
              <button
                type="button"
                data-testid="toc-entry"
                data-presentation-toc-entry=""
                data-active={active}
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelectEra(entry.firstStepIndex)}
              >
                {entry.era}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
