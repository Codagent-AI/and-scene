import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants.ts'

export interface AttributionOptions {
  href?: string
  label?: string
}

/** Toolkit disclosure link pinned to the bottom-right corner. */
export function Attribution({ href = ATTRIBUTION_HREF, label = ATTRIBUTION_LABEL }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'fixed', right: 0, bottom: 0 }}
    >
      {label}
    </a>
  )
}
