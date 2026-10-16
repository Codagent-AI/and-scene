import { DEFAULT_ATTRIBUTION } from '../constants.ts'
import { pointerSafe } from './blur.ts'
import type { AnyStep, Mode } from '../types.ts'

export interface AttributionOptions {
  label?: string
  href?: string
}

interface FooterProps {
  mode: Mode
  steps: readonly AnyStep[]
  index: number
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
  /** `false` hides the attribution; defaults to the and-scene link. */
  attribution?: AttributionOptions | false
}

export function Footer({ mode, steps, index, onJump, onPrev, onNext, attribution }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  const attr = attribution === false ? null : { ...DEFAULT_ATTRIBUTION, ...attribution }
  return (
    <footer data-presentation-footer="" style={{ display: 'flex', flexDirection: 'column' }}>
      {browse ? (
        <p data-presentation-caption="">{step.caption}</p>
      ) : (
        <h1 data-presentation-title="" data-step-title="">{step.title}</h1>
      )}
      {browse && (
        <div data-presentation-controls="" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 1rem' }}>
          <button
            type="button"
            data-presentation-prev=""
            aria-label="Previous step"
            disabled={index === 0}
            onClick={pointerSafe(onPrev)}
          >
            ←
          </button>
          <nav data-presentation-progress="" aria-label="Step progress" style={{ display: 'flex', flexWrap: 'wrap' }}>
            {steps.map((s, i) => {
              const active = i === index
              return (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-dot=""
                  data-active={active ? 'true' : 'false'}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={pointerSafe(() => onJump(i))}
                />
              )
            })}
          </nav>
          <button
            type="button"
            data-presentation-next=""
            aria-label="Next step"
            disabled={index === steps.length - 1}
            onClick={pointerSafe(onNext)}
          >
            →
          </button>
        </div>
      )}
      {attr && (
        <a
          data-presentation-attribution=""
          href={attr.href}
          target="_blank"
          rel="noreferrer noopener"
          style={{ alignSelf: 'flex-end' }}
        >
          {attr.label}
        </a>
      )}
    </footer>
  )
}
