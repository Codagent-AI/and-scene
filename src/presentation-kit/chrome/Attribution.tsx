import { ATTRIBUTION_LABEL, ATTRIBUTION_URL } from '../constants.ts'

export interface AttributionOptions {
  href?: string
  label?: string
}

/** Toolkit disclosure link, bottom-right; presentations style it via its hook. */
export function Attribution({ href = ATTRIBUTION_URL, label = ATTRIBUTION_LABEL }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      {label}
    </a>
  )
}
