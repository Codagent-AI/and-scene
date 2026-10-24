import type { AnchorHTMLAttributes } from 'react'

export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'

/** Toolkit disclosure pinned bottom-right; presentation CSS makes it legible. */
export function Attribution({ style, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_HREF}
      target="_blank"
      rel="noreferrer"
      {...rest}
      style={{ position: 'fixed', right: 0, bottom: 0, ...style }}
    >
      {ATTRIBUTION_LABEL}
    </a>
  )
}
