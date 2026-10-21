import type { AttributionOptions } from '../types'

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'

/** Default toolkit disclosure, pinned to the bottom-right of the presentation root. */
export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF }: AttributionOptions) {
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
