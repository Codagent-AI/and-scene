import type { MotionStyle } from 'motion/react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'
import { useAppearMotion } from './appearMotion'

export interface Geometry {
  x?: number
  y?: number
  w?: number
  h?: number
}

/** Positions an entity inside the design canvas; geometry only. */
export const placement = ({ x, y, w, h }: Geometry, style?: MotionStyle): MotionStyle => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
  ...style,
})

/**
 * Props shared by every entity: a stable `layoutId` for in-place morphs,
 * identity/style hooks, and exit motion. Enter motion comes from `Appear`.
 */
export function useEntityProps(kind: string, id: string) {
  return {
    layoutId: id,
    layout: true,
    transition: { layout: { duration: LAYOUT_T, ease: EASE } },
    exit: { opacity: 0, transition: { duration: EXIT_T, ease: EASE } },
    'data-presentation-node': kind,
    'data-presentation-entity': id,
    ...useAppearMotion(),
  }
}
