import type { StepMeta } from '../types'

interface TocProps {
  steps: readonly StepMeta[]
  index: number
  jump: (index: number) => void
}

export function Toc({ steps, index, jump }: TocProps) {
  const sections = new Map<string, number>()
  steps.forEach(({ era }, position) => {
    if (!sections.has(era)) sections.set(era, position)
  })
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      {Array.from(sections, ([era, position]) => {
        const active = steps[index].era === era
        return (
          <button
            key={era}
            type="button"
            data-presentation-toc-item=""
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'step' : undefined}
            onClick={() => jump(position)}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
