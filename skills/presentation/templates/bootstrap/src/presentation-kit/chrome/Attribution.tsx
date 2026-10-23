import { ATTRIBUTION_HREF, ATTRIBUTION_TEXT } from '../constants.ts'

/** Toolkit disclosure, anchored bottom-right; presentation CSS styles it. */
export function Attribution() {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_HREF}
      target="_blank"
      rel="noreferrer noopener"
      style={{ position: 'absolute', right: 0, bottom: 0 }}
    >
      {ATTRIBUTION_TEXT}
    </a>
  )
}
