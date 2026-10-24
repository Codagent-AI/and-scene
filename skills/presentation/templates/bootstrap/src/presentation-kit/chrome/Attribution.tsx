import { DEFAULT_ATTRIBUTION } from '../constants'
import type { AttributionOption } from '../types'

export function Attribution({ option }: { option?: AttributionOption }) {
  if (option === false) return null
  const label = option?.label ?? DEFAULT_ATTRIBUTION.label
  const href = option?.href ?? DEFAULT_ATTRIBUTION.href
  return (
    <a
      data-presentation-attribution=""
      data-presentation-chrome="attribution"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      {label}
    </a>
  )
}
