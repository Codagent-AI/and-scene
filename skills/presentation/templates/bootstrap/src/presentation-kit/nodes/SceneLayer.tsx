import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Absolutely positioned diagram layer, so mounting one layer never reflows another.
 * Keyed children that leave the tree animate out.
 */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div data-presentation-layer="" className={className} style={{ position: 'absolute', inset: 0, ...style }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
