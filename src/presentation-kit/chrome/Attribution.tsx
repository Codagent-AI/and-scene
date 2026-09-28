import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants'
import type { AttributionOptions } from '../types'

export interface AttributionProps {
  options?: AttributionOptions
}

/** Default bottom-right "made by and-scene" disclosure link. */
export function Attribution({ options }: AttributionProps) {
  if (options?.show === false) return null

  return (
    <a
      href={options?.href ?? ATTRIBUTION_HREF}
      target="_blank"
      rel="noreferrer"
      data-presentation-attribution=""
      className={options?.className}
      style={{ position: 'fixed', right: 16, bottom: 16 }}
    >
      {options?.label ?? ATTRIBUTION_LABEL}
    </a>
  )
}
