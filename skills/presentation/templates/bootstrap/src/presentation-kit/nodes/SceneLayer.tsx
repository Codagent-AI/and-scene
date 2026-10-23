import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Absolutely positioned layer for one part of a step's diagram, so mounting
 * one layer never reflows another. Departing keyed children animate out.
 */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div
      className={className}
      data-presentation-scene-layer=""
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
