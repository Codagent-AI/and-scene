import { useMemo } from 'react'
import type { Step } from '../types.ts'

type TocProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  activeIndex: number
  onGoToStep: (index: number) => void
  hidden?: boolean
}

export function Toc<TPayload>({ steps, activeIndex, onGoToStep, hidden = false }: TocProps<TPayload>) {
  const sections = useMemo(() => {
    const seen = new Set<string>()
    return steps.flatMap((step, index) => {
      if (seen.has(step.era)) return []
      seen.add(step.era)
      return [{ era: step.era, index }]
    })
  }, [steps])

  return (
    <aside className="presentation-toc" data-presentation-toc hidden={hidden}>
      <nav aria-label="Presentation sections">
        {sections.map((section) => {
          const active = steps[activeIndex]?.era === section.era
          return (
            <button
              type="button"
              key={section.era}
              className={active ? 'is-active' : undefined}
              data-presentation-toc-item
              data-state-active={active ? 'true' : 'false'}
              aria-current={active ? 'step' : undefined}
              aria-label={`Go to ${section.era}`}
              onClick={() => onGoToStep(section.index)}
            >
              {section.era}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
