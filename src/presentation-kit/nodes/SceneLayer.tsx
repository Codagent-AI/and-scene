import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * Absolutely positions a step's diagram so mounting one layer never reflows another. Direct
 * children need a `key`; those wrapped in `<Appear>` fade out when a later step drops them.
 */
export function SceneLayer({ className, style, children }: SceneLayerProps) {
  return (
    <div
      data-presentation-layer=""
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
