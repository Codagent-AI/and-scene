import type { CSSProperties } from 'react'

/** Canvas-space placement (design-canvas pixels); layout plumbing, not styling. */
export interface Placement {
  x: number
  y: number
  w?: number
  h?: number
}

export interface NodeHooks {
  /** Stable entity id; doubles as the shared `layoutId` so it morphs across steps. */
  id: string
  at?: Placement
  className?: string
  style?: CSSProperties
  /** Free-form variant hook exposed as `data-presentation-variant`. */
  variant?: string
}

export function placementStyle(at: Placement | undefined, style?: CSSProperties): CSSProperties {
  if (!at) return { ...style }
  return {
    position: 'absolute',
    left: at.x,
    top: at.y,
    width: at.w,
    height: at.h,
    boxSizing: 'border-box',
    ...style,
  }
}
