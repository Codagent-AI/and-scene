import { ATTRIBUTION_TEXT, ATTRIBUTION_URL } from '../constants'

/** Bottom-right disclosure link. Presentations style it through its hook. */
export function Attribution() {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      {ATTRIBUTION_TEXT}
    </a>
  )
}
