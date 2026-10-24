import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL } from '../constants.ts'
import type { SlotProps } from './slots.ts'

export interface AttributionOptions {
  label?: string
  href?: string
}

export interface AttributionProps {
  options?: AttributionOptions
  slot?: SlotProps
}

/** Bottom-right toolkit disclosure; style it through `[data-presentation-attribution]`. */
export function Attribution({ options, slot }: AttributionProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', flex: '0 0 auto' }} data-presentation-attribution-row="">
      <a
        href={options?.href ?? ATTRIBUTION_HREF}
        target="_blank"
        rel="noreferrer"
        {...slot}
        data-presentation-attribution=""
      >
        {options?.label ?? ATTRIBUTION_LABEL}
      </a>
    </div>
  )
}
