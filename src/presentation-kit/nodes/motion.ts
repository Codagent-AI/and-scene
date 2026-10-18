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

/** Present state for entities that were already on screen: no newcomer initial value or delay. */
export const PRESENT_ANIMATE = { opacity: 1 }

/**
 * Motion props for an entity: a newcomer starts hidden and fades in after the layout morph;
 * a continuing entity carries none of that, so it only morphs through its `layoutId`.
 */
export function enterProps(enter: boolean | undefined) {
  return enter
    ? { initial: APPEAR_INITIAL, animate: APPEAR_ANIMATE }
    : { animate: PRESENT_ANIMATE }
}

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
