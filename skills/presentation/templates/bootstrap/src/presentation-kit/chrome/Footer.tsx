import type { Mode, StepMeta } from '../types'

export function Footer({
  steps,
  index,
  mode,
  go,
  prev,
  next,
}: {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  go: (index: number) => void
  prev: () => void
  next: () => void
}) {
  return (
    <footer data-presentation-footer="">
      {mode === 'present' ? (
        <h1 data-presentation-title="" style={{ whiteSpace: 'nowrap' }}>
          {steps[index].title}
        </h1>
      ) : (
        <>
          <p data-presentation-caption="">{steps[index].caption}</p>
          <nav data-presentation-navigation="" aria-label="Steps">
            <button
              type="button"
              data-presentation-prev=""
              aria-label="Previous step"
              disabled={index === 0}
              onClick={prev}
            >
              ←
            </button>
            <div data-presentation-progress="">
              {steps.map((step, i) => (
                <button
                  key={step.id}
                  type="button"
                  data-presentation-progress-entry=""
                  data-presentation-active={i === index ? 'true' : 'false'}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${step.title}`}
                  onClick={() => go(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              data-presentation-next=""
              aria-label="Next step"
              disabled={index === steps.length - 1}
              onClick={next}
            >
              →
            </button>
          </nav>
        </>
      )}
    </footer>
  )
}
