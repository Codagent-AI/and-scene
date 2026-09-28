import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Absolutely positions a diagram over the canvas so mounting one layer never
 * reflows another. Keyed children that leave the layer play their exit.
 */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div
      className={['presentation-layer', className].filter(Boolean).join(' ')}
      data-presentation-layer=""
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
