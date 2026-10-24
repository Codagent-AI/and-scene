import type { CSSProperties } from 'react'

/** Position in design-canvas pixels. */
export interface At {
  x: number
  y: number
  w?: number
  h?: number
}

/** Absolute placement geometry only; authors style everything else. */
export function placement(at: At | undefined, style?: CSSProperties): CSSProperties {
  if (!at) return { ...style }
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, ...style }
}
