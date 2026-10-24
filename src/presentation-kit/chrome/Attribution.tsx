import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'
import type { AttributionOptions } from '../types'

/** Bottom-right toolkit disclosure. Presentations style it through `data-presentation-attribution`. */
export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF }: AttributionOptions) {
  return (
    <div data-presentation-attribution-row="" style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <a data-presentation-attribution="" href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    </div>
  )
}
