import { AnimatePresence } from 'motion/react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export interface SceneLayerProps extends HTMLAttributes<HTMLDivElement> {
  style?: CSSProperties
  /** Keyed entities; one that disappears from the list animates out. */
  children?: ReactNode
}

/**
 * Absolutely positions one step's diagram over the canvas so mounting a layer
 * never reflows another, and lets removed entities play their exit.
 */
export function SceneLayer({ style, children, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, ...style }}
      {...rest}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
