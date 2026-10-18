import { ATTRIBUTION_LABEL, ATTRIBUTION_URL } from '../constants'

export interface AttributionOptions {
  label?: string
  href?: string
}

/** Toolkit disclosure pinned to the bottom-right corner. Style it via the attribution hook. */
export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_URL }: AttributionOptions) {
  return (
    <div data-presentation-attribution-slot="" style={{ position: 'fixed', right: 0, bottom: 0 }}>
      <a data-presentation-attribution="" href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    </div>
  )
}
