import type { CSSProperties } from 'react'

/** Author hooks forwarded onto a chrome part's root element. */
export interface ChromeHooks {
  className?: string
  style?: CSSProperties
  [dataAttr: `data-${string}`]: string | number | boolean | undefined
}
