import type { CSSProperties } from 'react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T, LAYOUT_T } from '../constants'
import type { NodeProps } from './node'

export const LAYOUT_TRANSITION = { duration: LAYOUT_T, ease: EASE }
export const EXIT_TRANSITION = { duration: EXIT_T, ease: EASE }

export const APPEAR_INITIAL = { opacity: 0 }
export const APPEAR_ANIMATE = {
  opacity: 1,
  transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE },
}
export const APPEAR_EXIT = { opacity: 0, transition: { duration: EXIT_T, ease: EASE } }

/** Absolute canvas geometry for a node; empty when no coordinates were given. */
export function geometry({ x, y, width, height }: NodeProps): CSSProperties {
  const g: CSSProperties = {}
  if (x !== undefined || y !== undefined) {
    g.position = 'absolute'
    g.left = x ?? 0
    g.top = y ?? 0
  }
  if (width !== undefined) g.width = width
  if (height !== undefined) g.height = height
  return g
}
