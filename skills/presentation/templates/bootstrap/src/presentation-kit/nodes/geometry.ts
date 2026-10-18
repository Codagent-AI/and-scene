import type { CSSProperties } from 'react'

/** Position and size in design-canvas units. */
export interface Rect {
  x: number
  y: number
  w?: number
  h?: number
}

export function geometry(at: Rect | undefined, z: number | undefined): CSSProperties {
  const style: CSSProperties = {}
  if (at) {
    style.position = 'absolute'
    style.left = at.x
    style.top = at.y
    if (at.w !== undefined) style.width = at.w
    if (at.h !== undefined) style.height = at.h
  }
  if (z !== undefined) style.zIndex = z
  return style
}
