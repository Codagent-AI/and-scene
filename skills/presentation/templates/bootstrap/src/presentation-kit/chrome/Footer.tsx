import type { Mode, Step } from '../types'
import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../attribution'
import { Toc } from './Toc'
import type { Era } from './eras'

export interface FooterProps<TPayload> {
  mode: Mode
  steps: Step<TPayload>[]
  index: number
  eras: Era[]
  wide: boolean
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
  showAttribution: boolean
}

export function Footer<TPayload>({
  mode,
  steps,
  index,
  eras,
  wide,
  onGoTo,
  onPrev,
  onNext,
  showAttribution,
}: FooterProps<TPayload>) {
  const step = steps[index]
  const attribution = (
    <div data-presentation-attribution-slot="bottom-right" style={{ position: 'absolute', right: 8, bottom: 4 }}>
      <a data-presentation-attribution="" href={ATTRIBUTION_HREF} target="_blank" rel="noopener noreferrer">
        {ATTRIBUTION_LABEL}
      </a>
    </div>
  )

  const footerAttribution = showAttribution ? attribution : null

  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" style={{ position: 'relative' }}>
        <p data-presentation-title="">{step.title}</p>
        {footerAttribution}
      </footer>
    )
  }

  return (
    <footer data-presentation-footer="" style={{ position: 'relative' }}>
      <h2 data-presentation-step-title="">{step.title}</h2>
      <p data-presentation-caption="">{step.caption}</p>
      {wide ? <Toc eras={eras} activeEra={step.era} onSelect={onGoTo} /> : null}
      <nav aria-label="Step progress" data-presentation-progress="">
        {steps.map((entry, i) => {
          const active = i === index
          return (
            <button
              key={entry.id}
              type="button"
              data-presentation-progress-dot=""
              data-presentation-active={active ? 'true' : undefined}
              aria-current={active ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${entry.title}`}
              onClick={() => onGoTo(i)}
            />
          )
        })}
      </nav>
      <div data-presentation-controls="">
        <button type="button" data-presentation-prev="" disabled={index === 0} onClick={onPrev}>
          Previous
        </button>
        <button type="button" data-presentation-next="" disabled={index === steps.length - 1} onClick={onNext}>
          Next
        </button>
      </div>
      {footerAttribution}
    </footer>
  )
}
