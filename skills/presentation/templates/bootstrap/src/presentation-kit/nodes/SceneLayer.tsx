import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Absolutely positioned layer covering the canvas, so mounting one layer never
 * reflows another. Children removed from it run their exit animation.
 */
export function SceneLayer({ className, style, children, ...rest }: SceneLayerProps) {
  return (
    <div
      {...rest}
      data-presentation-layer=""
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, ...style }}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
