import { ATTRIBUTION_HREF, ATTRIBUTION_TEXT } from '../constants'
import { attributionStyle } from '../layout'

/** Bottom-right disclosure link. Presentations style it through the hook. */
export function Attribution() {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_HREF}
      target="_blank"
      rel="noopener noreferrer"
      style={attributionStyle}
    >
      {ATTRIBUTION_TEXT}
    </a>
  )
}
