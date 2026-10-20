import type { ReactNode } from 'react'
import { ATTRIBUTION_TEXT, ATTRIBUTION_URL } from '../constants.ts'

export function Attribution({ children }: { children?: ReactNode }) {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'absolute', right: 0, bottom: 0, zIndex: 1 }}
    >
      {children ?? ATTRIBUTION_TEXT}
    </a>
  )
}
