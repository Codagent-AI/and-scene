import { createContext, useContext } from 'react'
import type { MotionStyle } from 'motion/react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants.ts'

/** Lets the Stage tell entities when a step change (not a resize or mode switch) may morph them. */
export const LayoutDependencyContext = createContext<unknown>(undefined)

/** Literal design-canvas coordinates; every field is optional. */
export interface Geometry {
  x?: number
  y?: number
  w?: number
  h?: number
}

export function geometryStyle({ x, y, w, h }: Geometry, style?: MotionStyle): MotionStyle {
  const positioned = x !== undefined || y !== undefined
  return {
    ...(positioned ? { position: 'absolute' as const } : null),
    ...(x !== undefined ? { left: x } : null),
    ...(y !== undefined ? { top: y } : null),
    ...(w !== undefined ? { width: w } : null),
    ...(h !== undefined ? { height: h } : null),
    ...style,
  }
}

/** Motion props that give an entity a stable identity, an in-place morph, and an exit. */
export function useEntityMotion(id: string) {
  const layoutDependency = useContext(LayoutDependencyContext)
  return {
    layoutId: id,
    layout: true,
    layoutDependency,
    transition: { layout: { duration: LAYOUT_T, ease: EASE } },
    exit: { opacity: 0, transition: { duration: EXIT_T } },
    'data-presentation-entity': id,
  } as const
}
