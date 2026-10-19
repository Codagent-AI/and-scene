import type { Mode } from '../constants.ts'
import type { StepMeta } from '../types.ts'

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

/** Present: one-line title only. Browse: caption, progress indicators and prev/next. */
export function Footer({ steps, index, mode, onPrev, onNext, onJump }: FooterProps) {
  const step = steps[index]
  const place = { position: 'fixed', left: 0, right: 0, bottom: 0 } as const
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" style={place}>
        <h1 data-presentation-title="">{step.title}</h1>
      </footer>
    )
  }
  return (
    <footer data-presentation-footer="" style={place}>
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
        <button type="button" data-presentation-prev="" aria-label="Previous step" onClick={onPrev}>Previous</button>
        <button type="button" data-presentation-next="" aria-label="Next step" onClick={onNext}>Next</button>
      </div>
    </footer>
  )
}
