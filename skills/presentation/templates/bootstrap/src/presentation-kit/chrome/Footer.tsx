import type { Mode, SceneStep } from '../types'

export interface FooterProps {
  steps: readonly SceneStep[]
  index: number
  mode: Mode
  onGoTo(index: number): void
  onPrev(): void
  onNext(): void
}

export function Footer({ steps, index, mode, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="">
        <h1 data-presentation-title="">{step.title}</h1>
      </footer>
    )
  }
  return (
    <footer data-presentation-footer="">
      <p data-presentation-caption="">{step.caption}</p>
      <nav aria-label="Steps" data-presentation-progress="">
        {steps.map((s, i) => {
          const active = i === index
          return (
            <button
              key={s.id}
              type="button"
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={active ? 'step' : undefined}
              data-presentation-progress-item=""
              data-presentation-active={active ? 'true' : undefined}
              onClick={() => onGoTo(i)}
            />
          )
        })}
      </nav>
      <div data-presentation-nav="">
        <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
          Previous
        </button>
        <button
          type="button"
          data-presentation-next=""
          disabled={index === steps.length - 1}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </footer>
  )
}
