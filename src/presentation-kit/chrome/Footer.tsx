import type { Mode, StepMeta } from '../types'

interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  height: number
  onGo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

/** Present mode: one-line title only. Browse mode: title, caption, progress, prev/next. */
export function Footer({ mode, steps, index, height, onGo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  return (
    <footer
      data-presentation-footer=""
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}
    >
      <h2 data-presentation-step-title="" data-presentation-step-id={step.id}>
        {step.title}
      </h2>
      {mode === 'browse' && (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <nav data-presentation-progress="" aria-label="Progress">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                data-presentation-dot=""
                data-presentation-active={i === index ? '' : undefined}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                onClick={() => onGo(i)}
              />
            ))}
          </nav>
          <div data-presentation-controls="">
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
        </>
      )}
    </footer>
  )
}
