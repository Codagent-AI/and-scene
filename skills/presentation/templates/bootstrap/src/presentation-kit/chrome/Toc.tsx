import type { Step } from '../types'

interface TocProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  goTo: (index: number) => void
}

export function Toc<TPayload>({ steps, index, goTo }: TocProps<TPayload>) {
  const eras = steps.reduce<{ era: string; index: number }[]>((items, step, stepIndex) => {
    if (!items.some((item) => item.era === step.era)) items.push({ era: step.era, index: stepIndex })
    return items
  }, [])

  return (
    <nav data-presentation-toc aria-label="Presentation sections">
      {eras.map((item) => {
        const active = steps[index]?.era === item.era
        return (
          <button
            key={item.era}
            type="button"
            aria-current={active ? 'step' : undefined}
            data-presentation-toc-item
            data-presentation-active={active ? '' : undefined}
            onClick={() => goTo(item.index)}
          >
            {item.era}
          </button>
        )
      })}
    </nav>
  )
}
