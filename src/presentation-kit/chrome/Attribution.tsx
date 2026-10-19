import type { CSSProperties } from 'react'
import { DEFAULT_ATTRIBUTION } from '../constants'
import type { AttributionOptions } from '../types'

export interface AttributionProps extends AttributionOptions {
  className?: string
  style?: CSSProperties
}

/** Toolkit disclosure, pinned bottom-right. Style it through `data-presentation-attribution`. */
export function Attribution({
  label = DEFAULT_ATTRIBUTION.label,
  href = DEFAULT_ATTRIBUTION.href,
  className,
  style,
  ...rest
}: AttributionProps) {
  return (
    <a
      {...rest}
      data-presentation-attribution=""
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      style={{ position: 'fixed', right: 0, bottom: 0, ...style }}
    >
      {label}
    </a>
  )
}
