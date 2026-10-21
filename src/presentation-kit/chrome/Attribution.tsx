import { ATTRIBUTION_HEIGHT } from '../constants'
import type { AttributionOptions } from '../types'

export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'

export interface AttributionProps {
  /** `false` removes the attribution; an object replaces the default link. */
  override?: false | AttributionOptions
}

/** Bottom-right toolkit disclosure. Presentation CSS targets `[data-presentation-attribution]`. */
export function Attribution({ override }: AttributionProps) {
  if (override === false) return null
  return (
    <div
      data-presentation-attribution-slot
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        height: ATTRIBUTION_HEIGHT,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {override ? (
        override.content
      ) : (
        <a data-presentation-attribution href={ATTRIBUTION_URL} target="_blank" rel="noreferrer">
          made by and-scene
        </a>
      )}
    </div>
  )
}
