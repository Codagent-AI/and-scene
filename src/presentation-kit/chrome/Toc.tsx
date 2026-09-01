import type { Step } from '../types'

interface TocProps<TPayload> {
  steps: readonly Step<TPayload>[]
  activeIndex: number
  goTo: (index: number) => void
}

export function Toc<TPayload>({ steps, activeIndex, goTo }: TocProps<TPayload>) {
  const eras = steps.reduce<Array<{ era: string; index: number }>>((items, step, index) => {
    if (!items.some((item) => item.era === step.era)) items.push({ era: step.era, index })
    return items
  }, [])
  const activeEra = steps[activeIndex]?.era

  return (
    <nav aria-label="Presentation sections" data-presentation-toc="true">
      {eras.map(({ era, index }) => {
        const active = era === activeEra
        return (
          <button
            type="button"
            key={era}
            onClick={() => goTo(index)}
            aria-current={active ? 'step' : undefined}
            data-presentation-toc-active={active ? 'true' : 'false'}
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
