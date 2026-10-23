import { AnimatePresence } from 'motion/react'
import type { HTMLAttributes } from 'react'

/**
 * Absolutely positioned layer for one diagram. Keyed children that leave the
 * layer stay mounted until their exit animation completes.
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
