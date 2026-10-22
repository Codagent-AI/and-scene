import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants.ts'

/** Toolkit disclosure, pinned bottom-right; presentations style it through its hook. */
export function Attribution() {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_HREF}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'fixed', right: 8, bottom: 8 }}
    >
      {ATTRIBUTION_LABEL}
    </a>
  )
}
