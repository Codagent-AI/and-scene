import type { AnchorHTMLAttributes } from 'react'
import { ATTRIBUTION_RESERVE, DEFAULT_ATTRIBUTION } from '../constants'

export interface AttributionOptions extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  label?: string
}

/** Bottom-right toolkit disclosure; style it through `[data-presentation-attribution]` or its class. */
export function Attribution({ label = DEFAULT_ATTRIBUTION.label, href = DEFAULT_ATTRIBUTION.href, style, ...rest }: AttributionOptions) {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      {...rest}
      data-presentation-attribution=""
      href={href}
      style={{ position: 'absolute', right: 0, bottom: 0, height: ATTRIBUTION_RESERVE, display: 'flex', alignItems: 'center', ...style }}
    >
      {label}
    </a>
  )
}
