import type { ReactNode } from 'react'
import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL, type PresentationMode } from '../constants'
import type { StepMeta } from '../types'

export type AttributionOption = false | { label?: string; href?: string }

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: PresentationMode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
  attribution?: AttributionOption
  /** Optional extra controls (host-owned). */
  extra?: ReactNode
}

export function Footer({ steps, index, mode, onGoTo, onPrev, onNext, attribution, extra }: FooterProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  const attr = attribution === false ? null : attribution
  return (
    <footer data-presentation-footer style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      {browse ? (
        <p data-presentation-caption style={{ flexBasis: '100%' }}>{step.caption}</p>
      ) : (
        <p data-presentation-title style={{ flexBasis: '100%' }}>{step.title}</p>
      )}
      {browse ? (
        <>
          <button type="button" data-presentation-prev onClick={onPrev} disabled={index === 0} aria-label="Previous step">
            Prev
          </button>
          <ol data-presentation-progress style={{ display: 'flex' }}>
            {steps.map((s, i) => {
              const active = i === index
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    data-presentation-progress-item
                    data-presentation-active={active ? 'true' : undefined}
                    aria-current={active ? 'step' : undefined}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    onClick={() => onGoTo(i)}
                  />
                </li>
              )
            })}
          </ol>
          <button type="button" data-presentation-next onClick={onNext} disabled={index === steps.length - 1} aria-label="Next step">
            Next
          </button>
        </>
      ) : null}
      {extra}
      {attribution === false ? null : (
        <>
        <span aria-hidden="true" style={{ flexGrow: 1 }} />
        <a
          data-presentation-attribution
          href={attr?.href ?? ATTRIBUTION_HREF}
          target="_blank"
          rel="noreferrer"
        >
          {attr?.label ?? ATTRIBUTION_LABEL}
        </a>
        </>
      )}
    </footer>
  )
}
