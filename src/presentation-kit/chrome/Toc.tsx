import type { Step } from '../types'

export interface TocProps<TPayload> {
  steps: Step<TPayload>[]
  activeIndex: number
  onJump: (index: number) => void
}

interface EraEntry {
  era: string
  firstIndex: number
}

// One entry per contiguous run of steps sharing an era. An era that recurs in a
// later, non-consecutive section is a section of its own: collapsing by name
// would drop it from the table of contents and point its entry at the earlier
// section's first step.
function collectEras<TPayload>(steps: Step<TPayload>[]): EraEntry[] {
  const eras: EraEntry[] = []
  steps.forEach((step, index) => {
    if (eras.at(-1)?.era !== step.era) eras.push({ era: step.era, firstIndex: index })
  })
  return eras
}

export function Toc<TPayload>({ steps, activeIndex, onJump }: TocProps<TPayload>) {
  const eras = collectEras(steps)
  // Sections are contiguous, so the active one is the last section that starts
  // at or before the active step. Comparing era names instead would light up
  // every section sharing that name.
  const activeEraIndex = eras.reduce(
    (active, { firstIndex }, index) => (firstIndex <= activeIndex ? index : active),
    -1,
  )

  return (
    <nav data-presentation-chrome="toc" aria-label="Table of contents">
      <ul>
        {eras.map(({ era, firstIndex }, index) => {
          const active = index === activeEraIndex
          return (
            <li key={firstIndex}>
              <button
                type="button"
                data-testid={`toc-entry-${era}`}
                data-presentation-node="toc-entry"
                data-presentation-active={active}
                aria-current={active ? 'true' : undefined}
                onClick={() => onJump(firstIndex)}
              >
                {era}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
