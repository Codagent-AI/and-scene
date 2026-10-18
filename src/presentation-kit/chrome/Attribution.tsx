import { ATTRIBUTION_HEIGHT, ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'

export interface AttributionOptions {
  label?: string
  href?: string
}

export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF }: AttributionOptions) {
  return (
    <div
      data-presentation-chrome=""
      style={{ position: 'absolute', right: 0, bottom: 0, height: ATTRIBUTION_HEIGHT, display: 'flex', alignItems: 'center' }}
    >
      <a data-presentation-attribution="" href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </div>
  )
}
