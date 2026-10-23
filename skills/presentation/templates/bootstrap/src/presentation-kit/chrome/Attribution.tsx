import type { AnchorHTMLAttributes } from 'react'
import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'

export interface AttributionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  label?: string
}

export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF, style, ...rest }: AttributionProps) {
  return (
    <a
      data-presentation-attribution=""
      target="_blank"
      rel="noreferrer"
      href={href}
      {...rest}
      style={{ position: 'fixed', right: 0, bottom: 0, ...style }}
    >
      {label}
    </a>
  )
}
