import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants.ts'

/** Toolkit disclosure, bottom-right. Presentations style it via the hook. */
export function Attribution() {
  return (
    <div data-presentation-attribution-row="" style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end' }}>
      <a data-presentation-attribution="" href={ATTRIBUTION_HREF} target="_blank" rel="noreferrer">
        {ATTRIBUTION_LABEL}
      </a>
    </div>
  )
}
