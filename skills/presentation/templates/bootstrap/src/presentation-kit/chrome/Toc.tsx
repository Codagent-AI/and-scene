import type { Step } from '../types'

interface TocProps<TPayload> {
  steps: readonly Step<TPayload>[]
  stepIndex: number
  goTo: (index: number) => void
}

export function Toc<TPayload>({ steps, stepIndex, goTo }: TocProps<TPayload>) {
  const eras = steps.reduce<Array<{ era: string; index: number }>>((entries, step, index) => {
    if (!entries.some((entry) => entry.era === step.era)) entries.push({ era: step.era, index })
    return entries
  }, [])

  return (
    <nav aria-label="Presentation sections" data-presentation-toc>
      {eras.map(({ era, index }) => {
        const active = steps[stepIndex]?.era === era
        return (
          <button
            key={era}
            type="button"
            data-presentation-toc-entry
            data-presentation-active={active ? 'true' : 'false'}
            aria-current={active ? 'step' : undefined}
            onClick={() => goTo(index)}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
