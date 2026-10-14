import { ATTRIBUTION_URL } from '../constants'
import { hookAttrs, HOOK } from '../hooks'

/**
 * Bottom-right toolkit disclosure. Only placement is set here; the presentation
 * styles the link through the stable attribution hook.
 */
export function Attribution() {
  return (
    <a
      {...hookAttrs(HOOK.attribution)}
      href={ATTRIBUTION_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'absolute', right: 12, bottom: 8 }}
    >
      made by and-scene
    </a>
  )
}
