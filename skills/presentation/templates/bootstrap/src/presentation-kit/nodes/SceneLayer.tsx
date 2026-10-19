import { AnimatePresence } from 'motion/react'
import type { HTMLAttributes } from 'react'

/**
 * Absolutely positioned layer for one part of a step's diagram, so mounting
 * one layer never reflows another. Keyed direct children get exit animations.
 */
export function SceneLayer({ children, style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-scene-layer=""
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
