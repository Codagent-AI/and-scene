import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'

export interface AttributionOptions {
  label?: string
  href?: string
}

export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF }: AttributionOptions) {
  return (
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', right: 0, bottom: 0 }}>
      <a data-presentation-attribution="" href={href} target="_blank" rel="noreferrer noopener">
        {label}
      </a>
    </div>
  )
}
