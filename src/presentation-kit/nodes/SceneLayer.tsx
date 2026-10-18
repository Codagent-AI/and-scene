import { AnimatePresence } from 'motion/react'
import type { HTMLAttributes } from 'react'

/**
 * Absolutely positioned layer filling the canvas, so mounting one layer never reflows another.
 * Children added or removed later enter and exit through AnimatePresence.
 */
export function SceneLayer({ style, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-scene-layer=""
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
      {...rest}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  )
}
