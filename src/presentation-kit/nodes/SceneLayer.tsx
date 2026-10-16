import type { HTMLAttributes } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * Absolutely positions a step's diagram so mounting one layer never reflows
 * another, and lets departing children play their exit animation.
 */
export function SceneLayer({ style, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-layer=""
      style={{ position: 'absolute', inset: 0, ...style }}
      {...rest}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
