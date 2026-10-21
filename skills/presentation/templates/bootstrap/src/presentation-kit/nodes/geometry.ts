import type { CSSProperties } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const LAYOUT_TRANSITION = { duration: LAYOUT_T, ease: EASE }

/** Literal canvas coordinates; pure placement, no visual styling. */
export function rectStyle(at?: Rect): CSSProperties {
  return at
    ? { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h }
    : {}
}
