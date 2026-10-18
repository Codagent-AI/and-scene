import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'

export interface AttributionOptions {
  label?: string
  href?: string
}

/** Toolkit disclosure pinned to the bottom-right corner of the presentation root. */
export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      {label}
    </a>
  )
}
