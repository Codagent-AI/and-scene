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

function collectEras<TPayload>(steps: Step<TPayload>[]): EraEntry[] {
  const eras: EraEntry[] = []
  const seen = new Set<string>()
  steps.forEach((step, index) => {
    if (seen.has(step.era)) return
    seen.add(step.era)
    eras.push({ era: step.era, firstIndex: index })
  })
  return eras
}

export function Toc<TPayload>({ steps, activeIndex, onJump }: TocProps<TPayload>) {
  const eras = collectEras(steps)
  const activeEra = steps[activeIndex]?.era

  return (
    <nav data-presentation-chrome="toc" aria-label="Table of contents">
      <ul>
        {eras.map(({ era, firstIndex }) => {
          const active = era === activeEra
          return (
            <li key={era}>
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
