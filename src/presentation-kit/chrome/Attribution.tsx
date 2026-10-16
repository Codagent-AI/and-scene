import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'

export interface AttributionOptions {
  label?: string
  href?: string
}

export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'absolute', right: 24, bottom: 8 }}
    >
      {label}
    </a>
  )
}
