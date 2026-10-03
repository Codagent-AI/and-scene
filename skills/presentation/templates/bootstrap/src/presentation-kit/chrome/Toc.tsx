import type { StepMeta } from '../types'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
}

interface Section {
  era: string
  first: number
  last: number
}

function sections(steps: readonly StepMeta[]): Section[] {
  const out: Section[] = []
  steps.forEach((s, i) => {
    const tail = out[out.length - 1]
    if (tail && tail.era === s.era) tail.last = i
    else out.push({ era: s.era, first: i, last: i })
  })
  return out
}

/** Era-based table of contents; each entry jumps to its era's first step. */
export function Toc({ steps, index, onGoTo }: TocProps) {
  return (
    <nav className="presentation-toc" data-presentation-toc="" aria-label="Table of contents">
      <ol>
        {sections(steps).map((s) => {
          const active = index >= s.first && index <= s.last
          return (
            <li key={s.first}>
              <button
                type="button"
                className="presentation-toc-item"
                data-presentation-toc-item=""
                data-presentation-active={active ? 'true' : 'false'}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(s.first)}
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
