import { ATTRIBUTION_LABEL, ATTRIBUTION_URL, type Mode } from '../constants'
import type { StepMeta } from '../types'

export type AttributionOption = false | { label?: string; href?: string }

interface FooterProps {
  mode: Mode
  index: number
  steps: readonly StepMeta[]
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
  attribution?: AttributionOption
}

export function Footer({ mode, index, steps, onJump, onPrev, onNext, attribution }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer data-presentation-footer="" style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto' }}>
      {browse ? (
        <p data-presentation-step-caption="">{step.caption}</p>
      ) : (
        <h1 data-presentation-step-title="">{step.title}</h1>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        {browse && (
          <>
            <div data-presentation-progress="" role="group" aria-label="Step progress" style={{ display: 'flex' }}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item=""
                  data-presentation-active={i === index}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onJump(i)}
                />
              ))}
            </div>
            <div data-presentation-controls="" style={{ display: 'flex' }}>
              <button type="button" data-presentation-prev="" onClick={onPrev} aria-label="Previous step">
                Prev
              </button>
              <button type="button" data-presentation-next="" onClick={onNext} aria-label="Next step">
                Next
              </button>
            </div>
          </>
        )}
        {attribution !== false && (
          <a
            data-presentation-attribution=""
            href={attribution?.href ?? ATTRIBUTION_URL}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: 'auto' }}
          >
            {attribution?.label ?? ATTRIBUTION_LABEL}
          </a>
        )}
      </div>
    </footer>
  )
}
