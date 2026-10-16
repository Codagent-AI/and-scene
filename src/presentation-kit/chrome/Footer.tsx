import type { Mode, StepMeta } from '../types'
import { activate } from './activate'

interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  onGoTo: (i: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ mode, steps, index, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  return (
    <footer data-presentation-footer style={{ flex: 'none' }}>
      <h2 data-presentation-title>{step.title}</h2>
      {mode === 'browse' ? (
        <>
          <p data-presentation-caption>{step.caption}</p>
          <div
            data-presentation-controls
            style={{ display: 'flex', alignItems: 'center', gap: 16 }}
          >
            <button type="button" data-presentation-prev aria-label="Previous step" onClick={activate(onPrev)}>
              Previous
            </button>
            <nav
              data-presentation-progress
              aria-label="Step progress"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-dot={i}
                  data-presentation-active={i === index ? 'true' : undefined}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  onClick={activate(() => onGoTo(i))}
                />
              ))}
            </nav>
            <button type="button" data-presentation-next aria-label="Next step" onClick={activate(onNext)}>
              Next
            </button>
          </div>
        </>
      ) : null}
    </footer>
  )
}
