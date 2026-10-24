import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants.ts'
import type { Mode, StepMeta } from '../types.ts'

export interface AttributionOptions {
  label?: string
  href?: string
}

interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
  /** Pass `false` to omit the default attribution. */
  attribution?: AttributionOptions | false
}

export function Footer({ steps, index, mode, onGoTo, onPrev, onNext, attribution }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer data-presentation-footer="" style={{ position: 'relative', flex: '0 0 auto' }}>
      <h2 data-presentation-step-title="">{step.title}</h2>
      {browse && (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <nav data-presentation-nav="" aria-label="Steps">
            <button type="button" data-presentation-prev="" onClick={onPrev} aria-label="Previous step">
              Prev
            </button>
            <ol data-presentation-dots="" style={{ display: 'inline-flex' }}>
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-presentation-dot=""
                    data-presentation-active={i === index ? 'true' : 'false'}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={() => onGoTo(i)}
                  />
                </li>
              ))}
            </ol>
            <button type="button" data-presentation-next="" onClick={onNext} aria-label="Next step">
              Next
            </button>
          </nav>
        </>
      )}
      {attribution !== false && (
        <a
          data-presentation-attribution=""
          href={attribution?.href ?? ATTRIBUTION_HREF}
          target="_blank"
          rel="noreferrer"
          style={{ position: 'absolute', right: 0, bottom: 0 }}
        >
          {attribution?.label ?? ATTRIBUTION_LABEL}
        </a>
      )}
    </footer>
  )
}
