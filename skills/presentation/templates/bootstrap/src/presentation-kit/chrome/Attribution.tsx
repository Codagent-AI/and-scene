import { DEFAULT_ATTRIBUTION } from '../constants'
import type { AttributionOptions } from '../types'

export function Attribution({ label, href }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href ?? DEFAULT_ATTRIBUTION.href}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'fixed', right: 0, bottom: 0 }}
    >
      {label ?? DEFAULT_ATTRIBUTION.label}
    </a>
  )
}
