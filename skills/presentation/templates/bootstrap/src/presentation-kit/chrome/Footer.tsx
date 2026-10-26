import type { PresentationMode, Step } from '../types'

interface FooterProps<TPayload> {
  steps: readonly Step<TPayload>[]
  step: Step<TPayload>
  index: number
  mode: PresentationMode
  goTo: (index: number) => void
  next: () => void
  prev: () => void
}

export function Footer<TPayload>({ steps, step, index, mode, goTo, next, prev }: FooterProps<TPayload>) {
  if (mode === 'present') {
    return <footer data-presentation-footer data-presentation-mode={mode}>{step.title}</footer>
  }

  return (
    <footer data-presentation-footer data-presentation-mode={mode}>
      <p data-presentation-caption>{step.caption}</p>
      <div data-presentation-progress aria-label="Step progress">
        {steps.map((item, itemIndex) => {
          const active = itemIndex === index
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to step ${itemIndex + 1}`}
              aria-current={active ? 'step' : undefined}
              data-presentation-progress-item
              data-presentation-active={active ? '' : undefined}
              onClick={() => goTo(itemIndex)}
            >
              {itemIndex + 1}
            </button>
          )
        })}
      </div>
      <div data-presentation-controls>
        <button type="button" aria-label="Previous step" onClick={prev}>Previous</button>
        <button type="button" aria-label="Next step" onClick={next}>Next</button>
      </div>
    </footer>
  )
}
