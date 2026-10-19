import { ATTRIBUTION_LABEL, ATTRIBUTION_URL } from '../constants'

export interface AttributionOptions {
  label?: string
  href?: string
}

/** Only web and mail links may be rendered; anything else (e.g. `javascript:`) falls back to the default. */
function safeHref(href: string): string {
  try {
    const { protocol } = new URL(href, 'https://invalid.example')
    return ['http:', 'https:', 'mailto:'].includes(protocol) ? href : ATTRIBUTION_URL
  } catch {
    return ATTRIBUTION_URL
  }
}

/** Toolkit disclosure pinned to the bottom-right corner. Style it via the attribution hook. */
export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_URL }: AttributionOptions) {
  return (
    <div data-presentation-attribution-slot="" style={{ position: 'fixed', right: 0, bottom: 0 }}>
      <a data-presentation-attribution="" href={safeHref(href)} target="_blank" rel="noreferrer">
        {label}
      </a>
    </div>
  )
}
