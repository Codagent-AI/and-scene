import { DEFAULT_ATTRIBUTION } from '../constants.ts'
import type { AttributionOptions } from '../types.ts'

/** Toolkit disclosure link, anchored bottom-right in every mode. */
export function Attribution({ label = DEFAULT_ATTRIBUTION.label, href = DEFAULT_ATTRIBUTION.href }: AttributionOptions) {
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
