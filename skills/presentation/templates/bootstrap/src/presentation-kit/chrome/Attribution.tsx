import type { CSSProperties } from 'react'

export const ATTRIBUTION_URL = 'https://github.com/and-scene/and-scene'

const POSITION_STYLE: CSSProperties = { position: 'absolute', bottom: 0, right: 0 }

export function Attribution() {
  return (
    <a
      href={ATTRIBUTION_URL}
      target="_blank"
      rel="noreferrer"
      data-presentation-chrome="attribution"
      data-presentation-attribution="true"
      style={POSITION_STYLE}
    >
      made by and-scene
    </a>
  )
}
