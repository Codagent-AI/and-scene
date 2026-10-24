import { AnimatePresence } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Absolutely positions one layer of a step's diagram so mounting it never
 * reflows another, and lets keyed children play exit animations when they leave.
 */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
