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

/** Absolutely fills the canvas; used by layers and wrappers that must not affect layout. */
export const FILL_STYLE: CSSProperties = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }
