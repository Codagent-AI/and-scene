import { ATTRIBUTION_HREF, ATTRIBUTION_TEXT } from '../constants.ts'
import type { AttributionOptions, Mode } from '../types.ts'

interface FooterProps {
  mode: Mode
  title: string
  caption: string
  stepTitles: readonly string[]
  index: number
  /** `null` hides the attribution; omit for the default "made by and-scene" link. */
  attribution?: AttributionOptions | null
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

const DEFAULT_ATTRIBUTION: AttributionOptions = { text: ATTRIBUTION_TEXT, href: ATTRIBUTION_HREF }

export function Footer({
  mode,
  title,
  caption,
  stepTitles,
  index,
  attribution = DEFAULT_ATTRIBUTION,
  onGoTo,
  onPrev,
  onNext,
}: FooterProps) {
  const last = stepTitles.length - 1
  return (
    <footer data-presentation-footer="">
      {mode === 'browse' ? <p data-presentation-caption="">{caption}</p> : null}
      <div
        data-presentation-footer-bar=""
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {mode === 'present' ? (
          <p
            data-presentation-title=""
            style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {title}
          </p>
        ) : (
          <nav
            aria-label="Progress"
            data-presentation-progress=""
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <button type="button" data-presentation-prev="" aria-label="Previous step" disabled={index <= 0} onClick={onPrev}>
              Previous
            </button>
            {stepTitles.map((stepTitle, i) => (
              <button
                key={i}
                type="button"
                data-presentation-dot=""
                data-presentation-active={i === index ? 'true' : undefined}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${stepTitle}`}
                onClick={() => onGoTo(i)}
              />
            ))}
            <button type="button" data-presentation-next="" aria-label="Next step" disabled={index >= last} onClick={onNext}>
              Next
            </button>
          </nav>
        )}
        {attribution ? (
          <a
            data-presentation-attribution=""
            href={attribution.href}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: 'auto' }}
          >
            {attribution.text}
          </a>
        ) : null}
      </div>
    </footer>
  )
}
