import type { Mode } from '../constants'
import type { StepMeta } from '../types'
import { DEFAULT_ATTRIBUTION } from '../constants'

export type Attribution = false | { label: string; href: string }

interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  attribution?: Attribution
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export function Footer({ mode, steps, index, attribution = DEFAULT_ATTRIBUTION, onPrev, onNext, onJump }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer data-presentation-footer="">
      <div data-presentation-narration="">
        {browse ? (
          <>
            <h2 data-presentation-step-title="">{step.title}</h2>
            <p data-presentation-caption="">{step.caption}</p>
          </>
        ) : (
          <p data-presentation-step-title="" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {step.title}
          </p>
        )}
      </div>
      {browse && (
        <div data-presentation-nav="">
          <button type="button" data-presentation-prev="" onClick={onPrev} disabled={index === 0} aria-label="Previous step">
            Prev
          </button>
          <ol data-presentation-progress="" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex' }}>
            {steps.map((s, i) => {
              const active = i === index
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    data-presentation-progress-dot=""
                    data-presentation-active={active ? 'true' : undefined}
                    aria-current={active ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={() => onJump(i)}
                  />
                </li>
              )
            })}
          </ol>
          <button type="button" data-presentation-next="" onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">
            Next
          </button>
        </div>
      )}
      {attribution && (
        <a
          data-presentation-attribution=""
          href={attribution.href}
          target="_blank"
          rel="noreferrer noopener"
          style={{ position: 'absolute', right: 0, bottom: 0 }}
        >
          {attribution.label}
        </a>
      )}
    </footer>
  )
}
