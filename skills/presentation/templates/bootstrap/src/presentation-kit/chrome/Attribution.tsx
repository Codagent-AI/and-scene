import type { AnchorHTMLAttributes } from 'react'
import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'

export interface AttributionOptions extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  label?: string
  href?: string
}

export function Attribution({ label = ATTRIBUTION_LABEL, href = ATTRIBUTION_HREF, ...rest }: AttributionOptions) {
  return (
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', right: 0, bottom: 0 }}>
      <a data-presentation-attribution="" target="_blank" rel="noreferrer noopener" {...rest} href={href}>
        {label}
      </a>
    </div>
  )
}
