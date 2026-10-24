import { ChevronLeft, ChevronRight } from 'lucide-react'
import { stepNumber } from '../steps'
import type { Mode, StepMeta } from '../types'

interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ steps, index, mode, onGoTo, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  return (
    <footer data-presentation-footer>
      <h2 data-presentation-title>{step.title}</h2>
      {mode === 'browse' && (
        <>
          <p data-presentation-caption>{step.caption}</p>
          <div data-presentation-controls>
            <button
              type="button"
              data-presentation-nav="prev"
              aria-label="Previous step"
              disabled={index === 0}
              onClick={onPrev}
            >
              <ChevronLeft aria-hidden />
            </button>
            <ol data-presentation-progress aria-label="Step progress">
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-presentation-progress-item
                    data-presentation-active={i === index}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`Step ${stepNumber(i)}: ${s.title}`}
                    onClick={() => onGoTo(i)}
                  />
                </li>
              ))}
            </ol>
            <button
              type="button"
              data-presentation-nav="next"
              aria-label="Next step"
              disabled={index === steps.length - 1}
              onClick={onNext}
            >
              <ChevronRight aria-hidden />
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
