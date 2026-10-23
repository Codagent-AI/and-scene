import type { CSSProperties } from 'react'

export interface Geometry {
  x: number
  y: number
  w: number
  h: number
}

/** Data attributes an author may pass through to a primitive. */
export type DataProps = { [key: `data-${string}`]: string | undefined }

/** Absolute placement on the design canvas. Carries layout only, never visual style. */
export function geometryStyle(geometry?: Geometry): CSSProperties {
  if (!geometry) return {}
  return { position: 'absolute', left: geometry.x, top: geometry.y, width: geometry.w, height: geometry.h }
}
