import type { HTMLAttributes } from 'react'
import { AnimatePresence } from 'motion/react'

/**
 * One absolutely positioned layer of a step's diagram. Layers never reflow one
 * another, and entities removed from a layer exit before they unmount.
 */
export function SceneLayer({ style, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
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
