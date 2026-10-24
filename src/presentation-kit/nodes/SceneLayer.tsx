import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

export interface SceneLayerProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Absolutely positions one layer of a step's diagram over the canvas so mounting a
 * layer never reflows another. Keyed children that leave play their exit animation.
 */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      data-presentation-scene-layer=""
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
