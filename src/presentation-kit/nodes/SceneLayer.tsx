import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Absolutely positions a step's diagram; keyed children exit through AnimatePresence. */
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
