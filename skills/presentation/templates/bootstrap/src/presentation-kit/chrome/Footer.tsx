import { ATTRIBUTION_LABEL, ATTRIBUTION_URL } from '../constants'
import type { Mode, StepMeta } from '../types'

interface FooterProps {
  mode: Mode
  step: StepMeta
  steps: readonly StepMeta[]
  index: number
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
  attribution: { label: string; href: string } | null
}

export function Footer({
  mode,
  step,
  steps,
  index,
  onPrev,
  onNext,
  onJump,
  attribution,
}: FooterProps) {
  return (
    <footer
      data-presentation-footer=""
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
    >
      {mode === 'browse' ? (
        <>
          <h2 data-presentation-step-title="">{step.title}</h2>
          <p data-presentation-caption="">{step.caption}</p>
          <nav data-presentation-progress="" aria-label="Steps">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                data-presentation-progress-item=""
                data-presentation-step-id={s.id}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === index ? 'step' : undefined}
                data-presentation-active={i === index ? 'true' : undefined}
                onClick={() => onJump(i)}
              />
            ))}
          </nav>
          <div data-presentation-controls="">
            <button
              type="button"
              data-presentation-prev=""
              disabled={index <= 0}
              onClick={onPrev}
            >
              Previous
            </button>
            <button
              type="button"
              data-presentation-next=""
              disabled={index >= steps.length - 1}
              onClick={onNext}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <h2 data-presentation-title="">{step.title}</h2>
      )}
      {attribution && (
        <a
          data-presentation-attribution=""
          href={attribution.href || ATTRIBUTION_URL}
          target="_blank"
          rel="noreferrer"
        >
          {attribution.label || ATTRIBUTION_LABEL}
        </a>
      )}
    </footer>
  )
}
