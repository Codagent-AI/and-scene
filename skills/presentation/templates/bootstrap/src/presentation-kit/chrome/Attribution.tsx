import { ATTRIBUTION_LABEL, ATTRIBUTION_STRIP, ATTRIBUTION_URL } from '../constants'

export interface AttributionOptions {
  href?: string
  label?: string
}

export function Attribution({ href = ATTRIBUTION_URL, label = ATTRIBUTION_LABEL }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        height: ATTRIBUTION_STRIP,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {label}
    </a>
  )
}
