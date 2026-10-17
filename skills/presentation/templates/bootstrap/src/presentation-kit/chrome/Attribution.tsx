import { DEFAULT_ATTRIBUTION } from '../constants.ts'
import type { AttributionOptions } from '../types.ts'

export function Attribution({ label, href }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      data-presentation-chrome=""
      href={href ?? DEFAULT_ATTRIBUTION.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'fixed', right: 0, bottom: 0 }}
    >
      {label ?? DEFAULT_ATTRIBUTION.label}
    </a>
  )
}
