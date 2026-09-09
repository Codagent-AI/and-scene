import type { Step } from '../types'

interface TocProps<TPayload> {
  steps: readonly Step<TPayload>[]
  stepIndex: number
  onGoTo: (index: number) => void
}

export function Toc<TPayload>({ steps, stepIndex, onGoTo }: TocProps<TPayload>) {
  const eras = steps.reduce<{ era: string; index: number }[]>((items, step, index) => {
    if (!items.some((item) => item.era === step.era)) items.push({ era: step.era, index })
    return items
  }, [])

  return (
    <nav data-presentation-toc aria-label="Presentation sections">
      {eras.map(({ era, index }) => {
        const active = steps[stepIndex]?.era === era
        return (
          <button
            key={era}
            type="button"
            data-presentation-toc-entry
            data-active={active ? 'true' : 'false'}
            aria-current={active ? 'step' : undefined}
            onClick={() => onGoTo(index)}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
