import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'

/** Default toolkit disclosure, anchored bottom-right. Styling is the host's. */
export function Attribution() {
  return (
    <a
      className="presentation-attribution"
      data-presentation-attribution=""
      href={ATTRIBUTION_HREF}
      target="_blank"
      rel="noreferrer noopener"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      {ATTRIBUTION_LABEL}
    </a>
  )
}
