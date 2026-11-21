import type { StepMeta } from '../types'

export function Toc({ steps, index, go }: {
  steps: readonly StepMeta[]
  index: number
  go: (index: number) => void
}) {
  const eras = new Map<string, number>()
  steps.forEach((step, position) => {
    if (!eras.has(step.era)) eras.set(step.era, position)
  })

  return <nav aria-label="Table of contents" data-presentation-toc="">
    {[...eras].map(([era, position]) => {
      const active = era === steps[index].era
      return <button type="button" key={era} onClick={() => go(position)}
        data-presentation-toc-entry="" data-presentation-active={active}
        aria-current={active ? 'step' : undefined}>
        {era}
      </button>
    })}
  </nav>
}
