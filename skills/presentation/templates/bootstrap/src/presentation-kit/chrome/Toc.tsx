import type { StepMeta } from '../types'

export function Toc({
  steps,
  index,
  go,
}: {
  steps: readonly StepMeta[]
  index: number
  go: (index: number) => void
}) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return (
    <nav data-presentation-toc="" aria-label="Sections">
      {eras.map((era) => {
        const first = steps.findIndex((step) => step.era === era)
        const active = steps[index].era === era
        return (
          <button
            key={era}
            type="button"
            data-presentation-toc-entry=""
            data-presentation-active={active ? 'true' : 'false'}
            aria-current={active ? 'step' : undefined}
            onClick={() => go(first)}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
