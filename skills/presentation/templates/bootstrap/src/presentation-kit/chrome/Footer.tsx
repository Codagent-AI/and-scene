import type { Mode, StepMeta } from '../types'

interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ mode, steps, index, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  return (
    <footer
      data-presentation-footer=""
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}
    >
      {mode === 'present' ? (
        <h2 data-presentation-title="">{step.title}</h2>
      ) : (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <nav data-presentation-progress="" aria-label="Steps">
            {steps.map((s, i) => {
              const active = i === index
              return (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item=""
                  data-presentation-active={active ? 'true' : undefined}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onGoTo(i)}
                />
              )
            })}
          </nav>
          <div data-presentation-controls="">
            <button type="button" data-presentation-prev="" onClick={onPrev}>
              prev
            </button>
            <button type="button" data-presentation-next="" onClick={onNext}>
              next
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
