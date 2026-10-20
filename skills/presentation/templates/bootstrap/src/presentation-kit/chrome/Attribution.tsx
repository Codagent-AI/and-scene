export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'

export interface AttributionOptions {
  href?: string
  label?: string
}

export function Attribution({ href = ATTRIBUTION_HREF, label = ATTRIBUTION_LABEL }: AttributionOptions) {
  return (
    <a
      data-presentation-attribution=""
      href={href}
      rel="noopener"
      style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 10 }}
    >
      {label}
    </a>
  )
}
