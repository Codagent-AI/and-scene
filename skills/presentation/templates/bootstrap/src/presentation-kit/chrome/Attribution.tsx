import { ATTRIBUTION_RESERVE, DEFAULT_ATTRIBUTION } from '../constants'

export interface AttributionOptions {
  label?: string
  href?: string
}

/** Bottom-right toolkit disclosure; style it through `[data-presentation-attribution]`. */
export function Attribution({ label = DEFAULT_ATTRIBUTION.label, href = DEFAULT_ATTRIBUTION.href }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'absolute', right: 0, bottom: 0, height: ATTRIBUTION_RESERVE, display: 'flex', alignItems: 'center' }}
    >
      {label}
    </a>
  )
}
