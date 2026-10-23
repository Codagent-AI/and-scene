import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PresentationMode, StepMeta } from '../types'

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: PresentationMode
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export function Footer({ steps, index, mode, onPrev, onNext, onJump }: FooterProps) {
  const step = steps[index]
  const last = steps.length - 1
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
      <nav data-presentation-progress="" aria-label="Step progress">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            data-presentation-progress-item=""
            data-presentation-active={i === index ? 'true' : undefined}
            aria-current={i === index ? 'step' : undefined}
            aria-label={`Step ${i + 1}: ${s.title}`}
            onClick={() => onJump(i)}
          />
        ))}
      </nav>
      <div data-presentation-controls="">
        <button
          type="button"
          data-presentation-prev=""
          aria-label="Previous step"
          disabled={index === 0}
          onClick={onPrev}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          data-presentation-next=""
          aria-label="Next step"
          disabled={index === last}
          onClick={onNext}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </footer>
  )
}
