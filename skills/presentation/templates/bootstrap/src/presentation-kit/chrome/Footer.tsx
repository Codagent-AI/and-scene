import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Mode } from '../constants.ts'
import { DEFAULT_ATTRIBUTION_HREF, DEFAULT_ATTRIBUTION_LABEL } from '../constants.ts'
import type { AnyStep, Attribution } from '../types.ts'

interface FooterProps {
  mode: Mode
  step: AnyStep
  steps: readonly AnyStep[]
  index: number
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
  attribution?: Attribution | false
}

export function Footer({ mode, step, steps, index, onGoTo, onPrev, onNext, attribution }: FooterProps) {
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}
    >
      <h2 data-presentation-step-title>{step.title}</h2>
      {browse ? <p data-presentation-caption>{step.caption}</p> : null}
      {browse ? (
        <div data-presentation-controls style={{ display: 'flex', alignItems: 'center' }}>
          <button type="button" data-presentation-prev data-presentation-chrome aria-label="Previous step" disabled={index === 0} onClick={onPrev}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <nav data-presentation-progress aria-label="Progress" style={{ display: 'flex', alignItems: 'center' }}>
            {steps.map((s, i) => {
              const active = i === index
              return (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item
                  data-presentation-chrome
                  data-presentation-active={active ? 'true' : undefined}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onGoTo(i)}
                />
              )
            })}
          </nav>
          <button type="button" data-presentation-next data-presentation-chrome aria-label="Next step" disabled={index === steps.length - 1} onClick={onNext}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {attribution === false ? null : (
        <a
          data-presentation-attribution
          data-presentation-chrome
          href={attribution?.href ?? DEFAULT_ATTRIBUTION_HREF}
          style={{ position: 'absolute', right: 0, bottom: 0 }}
        >
          {attribution?.label ?? DEFAULT_ATTRIBUTION_LABEL}
        </a>
      )}
    </footer>
  )
}
