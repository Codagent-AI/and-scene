import type { FooterStep } from './Footer'

export interface TocProps {
  steps: readonly FooterStep[]
  eras: readonly string[]
  index: number
  onGoTo: (index: number) => void
}

/** Table of contents: one entry per era, jumping to that era's first step. */
export function Toc({ steps, eras, index, onGoTo }: TocProps) {
  const activeEra = steps[index]?.era
  return (
    <nav aria-label="Table of contents" data-presentation-toc="">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {eras.map((era) => {
          const active = era === activeEra
          return (
            <li key={era}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-era={era}
                data-presentation-active={active ? 'true' : undefined}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(steps.findIndex((s) => s.era === era))}
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
