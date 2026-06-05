import { toSections } from './tocSections'
import type { StepMeta } from '../types'

interface TocProps {
  steps: StepMeta[]
  step: number
  onSelect: (i: number) => void
}

export function Toc({ steps, step, onSelect }: TocProps) {
  const sections = toSections(steps)
  return (
    <nav
      aria-label="Contents"
      className="absolute left-8 top-1/2 z-20 hidden -translate-y-1/2 xl:block"
    >
      <ol className="space-y-3.5">
        {sections.map((sec) => {
          const active = step >= sec.start && step <= sec.end
          return (
            <li key={sec.era}>
              <button
                onClick={() => onSelect(sec.start)}
                aria-current={active ? 'step' : undefined}
                className={`text-left text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  active ? 'text-cyan' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {sec.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
