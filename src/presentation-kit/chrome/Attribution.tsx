import { ATTRIBUTION_LABEL, ATTRIBUTION_URL } from '../constants'

interface AttributionProps {
  label?: string
  href?: string
}

export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_URL }: AttributionProps) {
  return (
    <a
      data-presentation-attribution
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'fixed', right: 0, bottom: 0 }}
    >
      {label}
    </a>
  )
}
