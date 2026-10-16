import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'
import type { AttributionOptions } from '../types'

export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF }: AttributionOptions) {
  return (
    <div
      data-presentation-attribution-row
      style={{ flex: 'none', display: 'flex', justifyContent: 'flex-end' }}
    >
      <a data-presentation-attribution href={href} target="_blank" rel="noreferrer noopener">
        {label}
      </a>
    </div>
  )
}
